const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { randomInt } = require('node:crypto');
const { rateLimit } = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set before starting the server.');
}

// CẤU HÌNH API KEYS OAUTH
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", "'unsafe-inline'", "'unsafe-eval'",
                'https://accounts.google.com',
                'https://cdn.jsdelivr.net',
                'https://cdn.tailwindcss.com',
                'https://cdnjs.cloudflare.com',
                'https://connect.facebook.net'
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
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
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

const createRateLimit = (limit, windowMs, message) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message }
});
const loginRateLimit = createRateLimit(10, 15 * 60 * 1000, 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.');
const oauthRateLimit = createRateLimit(20, 15 * 60 * 1000, 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.');
const otpSendRateLimit = createRateLimit(3, 15 * 60 * 1000, 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.');
const otpVerifyRateLimit = createRateLimit(10, 15 * 60 * 1000, 'Quá nhiều lần xác thực mã. Vui lòng thử lại sau 15 phút.');

// Cấu hình Transporter Nodemailer (Gửi OTP qua Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
    }
});

// Database giả lập
const DB_USERS = process.env.NODE_ENV === 'production' ? [] : [
    { 
        id: 1, 
        username: 'user', 
        email: 'user@example.com',
        role: 'user', 
        passwordHash: bcrypt.hashSync('password123', 10) 
    },
    { 
        id: 2, 
        username: 'admin', 
        email: 'admin@example.com',
        role: 'admin', 
        passwordHash: bcrypt.hashSync('admin123', 10) 
    }
];

// Bộ nhớ tạm lưu OTP
const OTP_STORE = new Map();

// Middleware giải mã Cookie HttpOnly
function authenticateToken(req, res, next) {
    const token = req.cookies.session_token;
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        req.user = null;
        res.clearCookie('session_token');
        next();
    }
}

function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Cấm truy cập: Yêu cầu quyền Admin!' });
    next();
}

app.use(authenticateToken);

// ==========================================
// 1. API ROUTES (BACKEND)
// ==========================================

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
});

// API 1: Đăng nhập truyền thống
app.post('/api/login', loginRateLimit, async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string'
        || username.length > 254 || password.length > 256) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }
    const normalizedUsername = username.trim().toLocaleLowerCase();
    const user = DB_USERS.find(u =>
        u.username.toLocaleLowerCase() === normalizedUsername
        || u.email.toLocaleLowerCase() === normalizedUsername
    );
    if (!user || !user.passwordHash) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('session_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 });
    return res.json({ success: true, message: 'Đăng nhập thành công!', user: { username: user.username, role: user.role, email: user.email } });
});

// API 2: Google OAuth Login
app.post('/api/auth/google', oauthRateLimit, async (req, res) => {
    const { credential } = req.body;
    if (typeof credential !== 'string' || credential.length > 10000 || !GOOGLE_CLIENT_ID) {
        return res.status(400).json({ success: false, message: 'Đăng nhập Google chưa được cấu hình!' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(400).json({ success: false, message: 'Tài khoản Google chưa xác thực email!' });
        }

        const { email, name, sub } = payload;
        let user = DB_USERS.find(u => u.email === email);

        if (!user) {
            user = {
                id: DB_USERS.length + 1,
                username: name || email.split('@')[0],
                email: email,
                role: ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
                googleId: sub,
                passwordHash: null
            };
            DB_USERS.push(user);
        }

        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('session_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 });
        return res.json({ success: true, message: 'Đăng nhập Google thành công!', user: { username: user.username, role: user.role, email: user.email } });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Xác thực Google thất bại!' });
    }
});

// API 3: Facebook OAuth Login (Xác thực Access Token qua Facebook Graph API)
app.post('/api/auth/facebook', oauthRateLimit, async (req, res) => {
    const { accessToken } = req.body;
    if (typeof accessToken !== 'string' || accessToken.length > 4096) {
        return res.status(400).json({ success: false, message: 'Thiếu Token Facebook!' });
    }

    try {
        // Gọi Graph API của Facebook để kiểm tra thông tin User
        const fbResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,email`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!fbResponse.ok) {
            return res.status(400).json({ success: false, message: 'Xác thực Facebook không hợp lệ!' });
        }
        const fbData = await fbResponse.json();

        if (fbData.error || typeof fbData.id !== 'string') {
            return res.status(400).json({ success: false, message: 'Xác thực Facebook không hợp lệ!' });
        }

        const { id, name, email } = fbData;
        const userEmail = email || `${id}@facebook.user`;

        let user = DB_USERS.find(u => u.facebookId === id || (email && u.email === email));

        if (!user) {
            user = {
                id: DB_USERS.length + 1,
                username: name || `fb_${id}`,
                email: userEmail,
                role: 'user',
                facebookId: id,
                passwordHash: null
            };
            DB_USERS.push(user);
        }

        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('session_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 });
        return res.json({ success: true, message: 'Đăng nhập Facebook thành công!', user: { username: user.username, role: user.role, email: user.email } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xác thực Facebook!' });
    }
});

// API 4: Gửi OTP Gmail
app.post('/api/auth/send-otp', otpSendRateLimit, async (req, res) => {
    const { email } = req.body;
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
        return res.status(503).json({ success: false, message: 'Chức năng gửi OTP chưa được cấu hình!' });
    }

    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ.' });
    }
    const normalizedEmail = email.trim().toLocaleLowerCase();
    const user = DB_USERS.find(u => u.email.toLocaleLowerCase() === normalizedEmail);
    const genericResponse = {
        success: true,
        message: 'Nếu email có tài khoản và dịch vụ gửi thư khả dụng, mã xác minh sẽ được gửi.'
    };
    if (!user) return res.json(genericResponse);

    const existingOtp = OTP_STORE.get(normalizedEmail);
    if (existingOtp && Date.now() < existingOtp.resendAfter) return res.json(genericResponse);

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = bcrypt.hashSync(otp, 8);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    OTP_STORE.set(normalizedEmail, { otpHash, expiresAt, resendAfter: Date.now() + 60 * 1000, attempts: 0 });

    try {
        await transporter.sendMail({
            from: `"VocabMind Security" <${process.env.GMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'Mã OTP Đổi Mật Khẩu - VocabMind Pro',
            html: `<h2>Mã OTP của bạn là: <b style="color: #10b981;">${otp}</b></h2>`
        });
        return res.json(genericResponse);
    } catch (err) {
        OTP_STORE.delete(normalizedEmail);
        console.error('Failed to send password reset OTP:', err);
        return res.status(500).json({ success: false, message: 'Không thể gửi OTP lúc này. Vui lòng thử lại sau!' });
    }
});

// API 5: Xác thực OTP & Đổi Mật Khẩu
app.post('/api/auth/change-password-otp', otpVerifyRateLimit, async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string'
        || email.length > 254 || !/^\d{6}$/.test(otp)
        || newPassword.length < 10 || newPassword.length > 256) {
        return res.status(400).json({ success: false, message: 'Thông tin không hợp lệ hoặc mật khẩu chưa đủ 10 ký tự.' });
    }
    const normalizedEmail = email.trim().toLocaleLowerCase();

    const record = OTP_STORE.get(normalizedEmail);
    if (!record || Date.now() >= record.expiresAt) {
        OTP_STORE.delete(normalizedEmail);
        return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn!' });
    }

    const isOtpValid = await bcrypt.compare(otp, record.otpHash);
    if (!isOtpValid) {
        record.attempts++;
        if (record.attempts >= 5) OTP_STORE.delete(normalizedEmail);
        return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
    }

    const user = DB_USERS.find(u => u.email.toLocaleLowerCase() === normalizedEmail);
    if (!user) {
        OTP_STORE.delete(normalizedEmail);
        return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    OTP_STORE.delete(normalizedEmail);

    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// API Lấy thông tin phiên
app.get('/api/me', (req, res) => {
    if (!req.user) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, user: { username: req.user.username, role: req.user.role, email: req.user.email } });
});

// API Đăng xuất
app.post('/api/logout', (req, res) => {
    res.clearCookie('session_token', { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true });
});

// API Admin
app.get('/api/admin/cookie-inspector', requireAdmin, (req, res) => {
    res.json({ status: "VERIFIED_ADMIN_SESSION", authenticatedUser: req.user });
});

// Frontend runtime OAuth configuration (IDs are public client identifiers).
app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID, facebookAppId: FACEBOOK_APP_ID });
});

app.use(express.static(require('node:path').join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`🚀 Server VocabMind Multi-Auth đang chạy tại: http://localhost:${PORT}`);
});