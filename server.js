const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { randomBytes, randomInt, createHash } = require('node:crypto');
const { OAuth2Client } = require('google-auth-library');
const { Pool } = require('pg');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_COOKIE = 'session_token';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL must be set before starting the server.');
}

app.set('trust proxy', 1);

const pool = new Pool({ connectionString: DATABASE_URL });
pool.on('error', error => {
    console.error('Unexpected PostgreSQL pool error:', error);
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                'https://accounts.google.com',
                'https://cdn.jsdelivr.net',
                'https://cdn.sheetjs.com',
                'https://cdnjs.cloudflare.com',
                'https://connect.facebook.net'
            ],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            styleSrcAttr: ["'unsafe-inline'"],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com', 'https://platform-lookaside.fbsbx.com'],
            connectSrc: [
                "'self'",
                'https://accounts.google.com',
                'https://www.googleapis.com',
                'https://graph.facebook.com',
                'https://connect.facebook.net',
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com'
            ],
            frameSrc: ['https://accounts.google.com', 'https://www.google.com', 'https://www.facebook.com'],
            workerSrc: ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const asyncHandler = handler => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

const createRateLimit = (bucket, limit, windowMs, message) => asyncHandler(async (req, res, next) => {
    const clientHash = createHash('sha256').update(`${bucket}:${req.ip || 'unknown'}`).digest('hex');
    const result = await pool.query(
        `INSERT INTO api_rate_limits (bucket, client_hash, count, reset_at)
         VALUES ($1, $2, 1, NOW() + ($3::double precision * INTERVAL '1 millisecond'))
         ON CONFLICT (bucket, client_hash) DO UPDATE SET
             count = CASE WHEN api_rate_limits.reset_at <= NOW() THEN 1 ELSE api_rate_limits.count + 1 END,
             reset_at = CASE WHEN api_rate_limits.reset_at <= NOW()
                 THEN NOW() + ($3::double precision * INTERVAL '1 millisecond')
                 ELSE api_rate_limits.reset_at END
         RETURNING count, reset_at`,
        [bucket, clientHash, windowMs]
    );
    const { count, reset_at: resetAt } = result.rows[0];
    const resetInSeconds = Math.max(0, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - count));
    res.setHeader('RateLimit-Reset', resetInSeconds);
    if (count > limit) {
        res.setHeader('Retry-After', resetInSeconds);
        return res.status(429).json({ success: false, message });
    }
    return next();
});
const loginRateLimit = createRateLimit('login', 10, 15 * 60 * 1000, 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.');
const oauthRateLimit = createRateLimit('oauth', 20, 15 * 60 * 1000, 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.');
const otpSendRateLimit = createRateLimit('otp-send', 3, 15 * 60 * 1000, 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.');
const otpVerifyRateLimit = createRateLimit('otp-verify', 10, 15 * 60 * 1000, 'Quá nhiều lần xác thực mã. Vui lòng thử lại sau 15 phút.');
const stateWriteRateLimit = createRateLimit('state-write', 30, 60 * 1000, 'Quá nhiều yêu cầu đồng bộ dữ liệu. Vui lòng thử lại sau.');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
    }
});

const hashToken = token => createHash('sha256').update(token).digest('hex');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
};

const clearSessionCookie = res => res.clearCookie(SESSION_COOKIE, cookieOptions);

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS app_users (
            id BIGSERIAL PRIMARY KEY,
            username VARCHAR(80) NOT NULL,
            email VARCHAR(254) NOT NULL UNIQUE,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            google_id VARCHAR(255) UNIQUE,
            facebook_id VARCHAR(255) UNIQUE,
            password_hash TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS app_sessions (
            token_hash CHAR(64) PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app_sessions(expires_at);
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            email VARCHAR(254) PRIMARY KEY REFERENCES app_users(email) ON DELETE CASCADE,
            otp_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            resend_after TIMESTAMPTZ NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS app_user_data (
            user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
            state JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS api_rate_limits (
            bucket VARCHAR(40) NOT NULL,
            client_hash CHAR(64) NOT NULL,
            count INTEGER NOT NULL,
            reset_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (bucket, client_hash)
        );
    `);
    await pool.query('DELETE FROM app_sessions WHERE expires_at <= NOW()');
}

function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Cấm truy cập: Yêu cầu quyền Admin!' });
    next();
}

function verifyRequestOrigin(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) {
        return res.status(403).json({ success: false, message: 'Yêu cầu không có nguồn gốc hợp lệ.' });
    }
    try {
        const originUrl = new URL(origin);
        const expectedOrigin = `${req.protocol}://${req.get('host')}`;
        if (originUrl.origin !== expectedOrigin) {
            return res.status(403).json({ success: false, message: 'Nguồn yêu cầu không được phép.' });
        }
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Nguồn yêu cầu không hợp lệ.' });
    }
    next();
}

async function authenticateSession(req, res, next) {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.role
             FROM app_sessions s
             JOIN app_users u ON u.id = s.user_id
             WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
            [hashToken(token)]
        );
        req.user = result.rows[0] || null;
        if (!req.user) clearSessionCookie(res);
        return next();
    } catch (error) {
        return next(error);
    }
}

async function createSession(req, res, user) {
    const oldToken = req.cookies[SESSION_COOKIE];
    if (typeof oldToken === 'string') {
        await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashToken(oldToken)]);
    }

    const token = randomBytes(32).toString('base64url');
    await pool.query(
        `INSERT INTO app_sessions (token_hash, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [hashToken(token), user.id]
    );
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
}

function publicUser(user) {
    return { username: user.username, role: user.role, email: user.email };
}

async function findOrCreateOAuthUser(provider, { providerId, email, name }) {
    const providerColumn = provider === 'google' ? 'google_id' : 'facebook_id';
    const otherProviderColumn = provider === 'google' ? 'facebook_id' : 'google_id';
    const existingByProvider = await pool.query(
        `SELECT id, username, email, role, google_id, facebook_id, password_hash
         FROM app_users WHERE ${providerColumn} = $1`,
        [providerId]
    );
    if (existingByProvider.rows[0]) return existingByProvider.rows[0];

    const existingByEmail = await pool.query(
        `SELECT id, username, email, role, google_id, facebook_id, password_hash
         FROM app_users WHERE email = $1`,
        [email]
    );
    if (existingByEmail.rows[0]) {
        const user = existingByEmail.rows[0];
        if (user[otherProviderColumn] || user.password_hash) {
            const error = new Error('Email này đã được liên kết với phương thức đăng nhập khác.');
            error.status = 409;
            throw error;
        }
        const linked = await pool.query(
            `UPDATE app_users SET ${providerColumn} = $1 WHERE id = $2
             RETURNING id, username, email, role`,
            [providerId, user.id]
        );
        return linked.rows[0];
    }

    const role = ADMIN_EMAIL && email === ADMIN_EMAIL ? 'admin' : 'user';
    const username = (name || email.split('@')[0]).trim().slice(0, 80) || email.split('@')[0];
    try {
        const created = await pool.query(
            `INSERT INTO app_users (username, email, role, ${providerColumn})
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, role`,
            [username, email, role, providerId]
        );
        return created.rows[0];
    } catch (error) {
        if (error.code !== '23505') throw error;
        const racedUser = await pool.query(
            `SELECT id, username, email, role FROM app_users WHERE ${providerColumn} = $1`,
            [providerId]
        );
        if (racedUser.rows[0]) return racedUser.rows[0];
        const conflict = new Error('Email này đã được đăng ký bằng phương thức đăng nhập khác.');
        conflict.status = 409;
        throw conflict;
    }
}

app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
app.use('/api', verifyRequestOrigin);
app.use('/api', asyncHandler(authenticateSession));

app.get('/healthz', asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
}));

app.post('/api/login', loginRateLimit, asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string'
        || username.length > 254 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }
    const normalizedUsername = username.trim().toLowerCase();
    const result = await pool.query(
        'SELECT id, username, email, role, password_hash FROM app_users WHERE lower(username) = $1 OR lower(email) = $1 LIMIT 1',
        [normalizedUsername]
    );
    const user = result.rows[0];
    if (!user?.password_hash || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }
    await createSession(req, res, user);
    return res.json({ success: true, message: 'Đăng nhập thành công!', user: publicUser(user) });
}));

app.post('/api/auth/google', oauthRateLimit, asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (typeof credential !== 'string' || credential.length > 10000 || !GOOGLE_CLIENT_ID) {
        return res.status(400).json({ success: false, message: 'Đăng nhập Google chưa được cấu hình!' });
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
    } catch (error) {
        console.error('Google token verification failed:', error);
        return res.status(401).json({ success: false, message: 'Xác thực Google thất bại!' });
    }
    if (!payload?.email || !payload.email_verified || typeof payload.sub !== 'string') {
        return res.status(401).json({ success: false, message: 'Tài khoản Google chưa xác thực email!' });
    }

    const email = payload.email.trim().toLowerCase();
    const user = await findOrCreateOAuthUser('google', {
        providerId: payload.sub,
        email,
        name: typeof payload.name === 'string' ? payload.name : ''
    });
    await createSession(req, res, user);
    return res.json({ success: true, message: 'Đăng nhập Google thành công!', user: publicUser(user) });
}));

app.post('/api/auth/facebook', oauthRateLimit, asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    if (typeof accessToken !== 'string' || accessToken.length > 4096) {
        return res.status(400).json({ success: false, message: 'Thiếu Token Facebook!' });
    }

    let fbData;
    try {
        const fbResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,email`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!fbResponse.ok) {
            return res.status(401).json({ success: false, message: 'Xác thực Facebook không hợp lệ!' });
        }
        fbData = await fbResponse.json();
    } catch (error) {
        console.error('Facebook identity verification request failed:', error.name);
        return res.status(502).json({ success: false, message: 'Không thể xác thực Facebook lúc này.' });
    }

    if (fbData.error || typeof fbData.id !== 'string') {
        return res.status(401).json({ success: false, message: 'Xác thực Facebook không hợp lệ!' });
    }
    const email = typeof fbData.email === 'string'
        ? fbData.email.trim().toLowerCase()
        : `${fbData.id}@facebook.user`;
    const user = await findOrCreateOAuthUser('facebook', {
        providerId: fbData.id,
        email,
        name: typeof fbData.name === 'string' ? fbData.name : `fb_${fbData.id}`
    });
    await createSession(req, res, user);
    return res.json({ success: true, message: 'Đăng nhập Facebook thành công!', user: publicUser(user) });
}));

app.post('/api/auth/send-otp', otpSendRateLimit, asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
        return res.status(503).json({ success: false, message: 'Chức năng gửi OTP chưa được cấu hình!' });
    }
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query('SELECT id FROM app_users WHERE email = $1', [normalizedEmail]);
    const genericResponse = {
        success: true,
        message: 'Nếu email có tài khoản và dịch vụ gửi thư khả dụng, mã xác minh sẽ được gửi.'
    };
    if (!userResult.rows[0]) return res.json(genericResponse);

    const existingOtp = await pool.query(
        'SELECT resend_after FROM password_reset_otps WHERE email = $1',
        [normalizedEmail]
    );
    if (existingOtp.rows[0] && Date.now() < new Date(existingOtp.rows[0].resend_after).getTime()) {
        return res.json(genericResponse);
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 8);
    await pool.query(
        `INSERT INTO password_reset_otps (email, otp_hash, expires_at, resend_after, attempts)
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW() + INTERVAL '1 minute', 0)
         ON CONFLICT (email) DO UPDATE SET
             otp_hash = EXCLUDED.otp_hash,
             expires_at = EXCLUDED.expires_at,
             resend_after = EXCLUDED.resend_after,
             attempts = 0`,
        [normalizedEmail, otpHash]
    );
    try {
        await transporter.sendMail({
            from: `"VocabMind Security" <${process.env.GMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'Mã OTP Đổi Mật Khẩu - VocabMind Pro',
            html: `<h2>Mã OTP của bạn là: <b style="color: #10b981;">${otp}</b></h2>`
        });
    } catch (error) {
        await pool.query('DELETE FROM password_reset_otps WHERE email = $1', [normalizedEmail]);
        console.error('Failed to send password reset OTP:', error);
        return res.status(500).json({ success: false, message: 'Không thể gửi OTP lúc này. Vui lòng thử lại sau!' });
    }
    return res.json(genericResponse);
}));

app.post('/api/auth/change-password-otp', otpVerifyRateLimit, asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string'
        || email.length > 254 || !/^\d{6}$/.test(otp)
        || newPassword.length < 10 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        return res.status(400).json({ success: false, message: 'Thông tin không hợp lệ hoặc mật khẩu chưa đủ 10 ký tự, tối đa 72 byte.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const otpResult = await client.query(
            'SELECT otp_hash, expires_at, attempts FROM password_reset_otps WHERE email = $1 FOR UPDATE',
            [normalizedEmail]
        );
        const record = otpResult.rows[0];
        if (!record || Date.now() >= new Date(record.expires_at).getTime() || record.attempts >= 5) {
            await client.query('DELETE FROM password_reset_otps WHERE email = $1', [normalizedEmail]);
            await client.query('COMMIT');
            return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn!' });
        }

        if (!await bcrypt.compare(otp, record.otp_hash)) {
            const attempts = record.attempts + 1;
            if (attempts >= 5) {
                await client.query('DELETE FROM password_reset_otps WHERE email = $1', [normalizedEmail]);
            } else {
                await client.query('UPDATE password_reset_otps SET attempts = $2 WHERE email = $1', [normalizedEmail, attempts]);
            }
            await client.query('COMMIT');
            return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await client.query('UPDATE app_users SET password_hash = $2 WHERE email = $1', [normalizedEmail, passwordHash]);
        await client.query('DELETE FROM app_sessions WHERE user_id = (SELECT id FROM app_users WHERE email = $1)', [normalizedEmail]);
        await client.query('DELETE FROM password_reset_otps WHERE email = $1', [normalizedEmail]);
        await client.query('COMMIT');
        clearSessionCookie(res);
        return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

app.get('/api/me', (req, res) => {
    if (!req.user) return res.json({ loggedIn: false });
    return res.json({ loggedIn: true, user: publicUser(req.user) });
});

app.get('/api/state', requireAuth, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT state FROM app_user_data WHERE user_id = $1', [req.user.id]);
    return res.json({ state: result.rows[0]?.state || null });
}));

app.put('/api/state', requireAuth, stateWriteRateLimit, asyncHandler(async (req, res) => {
    const { vocabs, vocabSets, profile } = req.body;
    const validProfile = profile && typeof profile === 'object'
        && !Array.isArray(profile)
        && typeof profile.name === 'string' && profile.name.length <= 80
        && typeof profile.avatar === 'string' && profile.avatar.length <= 16
        && Number.isSafeInteger(profile.xp) && profile.xp >= 0
        && Number.isSafeInteger(profile.streak) && profile.streak >= 0
        && Number.isSafeInteger(profile.level) && profile.level > 0;
    const validVocabs = Array.isArray(vocabs) && vocabs.length <= 10000
        && vocabs.every(vocab => vocab && typeof vocab === 'object' && !Array.isArray(vocab)
            && typeof vocab.word === 'string' && vocab.word.length <= 1000
            && typeof vocab.meaning === 'string' && vocab.meaning.length <= 10000);
    const validSets = Array.isArray(vocabSets) && vocabSets.length <= 1000
        && vocabSets.every(set => typeof set === 'string' && set.length <= 256);
    const state = validVocabs && validSets && validProfile
        ? { vocabs, vocabSets, profile }
        : null;
    if (!state || Buffer.byteLength(JSON.stringify(state)) > 900 * 1024) {
        return res.status(400).json({ success: false, message: 'Dữ liệu học không hợp lệ hoặc vượt quá giới hạn lưu trữ.' });
    }

    await pool.query(
        `INSERT INTO app_user_data (user_id, state, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
        [req.user.id, JSON.stringify(state)]
    );
    return res.json({ success: true });
}));

app.post('/api/logout', asyncHandler(async (req, res) => {
    const token = req.cookies[SESSION_COOKIE];
    if (typeof token === 'string') {
        await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashToken(token)]);
    }
    clearSessionCookie(res);
    return res.json({ success: true });
}));

app.get('/api/admin/cookie-inspector', requireAdmin, (req, res) => {
    res.json({ status: 'VERIFIED_ADMIN_SESSION', authenticatedUser: req.user });
});

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID, facebookAppId: FACEBOOK_APP_ID });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((error, req, res, next) => {
    console.error('Unhandled request error:', error);
    if (res.headersSent) return next(error);
    return res.status(error.status || 500).json({
        success: false,
        message: error.status ? error.message : 'Đã xảy ra lỗi máy chủ.'
    });
});

async function startServer() {
    await initializeDatabase();
    const cleanupTimer = setInterval(async () => {
        try {
            await pool.query('DELETE FROM app_sessions WHERE expires_at <= NOW()');
            await pool.query('DELETE FROM password_reset_otps WHERE expires_at <= NOW()');
            await pool.query('DELETE FROM api_rate_limits WHERE reset_at <= NOW()');
        } catch (error) {
            console.error('Unable to remove expired sessions or OTP records:', error);
        }
    }, 60 * 60 * 1000);
    cleanupTimer.unref();
    app.listen(PORT, () => {
        console.log(`VocabMind server is listening on port ${PORT}.`);
    });
}

startServer().catch(error => {
    console.error('Unable to initialize the application database:', error);
    process.exitCode = 1;
});
