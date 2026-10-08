const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set before starting the server.');
}

// CẤU HÌNH API KEYS OAUTH
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(express.json());
app.use(cookieParser());

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
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = DB_USERS.find(u => u.username === username || u.email === username);
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
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential || !GOOGLE_CLIENT_ID) {
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
app.post('/api/auth/facebook', async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
        return res.status(400).json({ success: false, message: 'Thiếu Token Facebook!' });
    }

    try {
        // Gọi Graph API của Facebook để kiểm tra thông tin User
        const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name,email`);
        const fbData = await fbResponse.json();

        if (fbData.error) {
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
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    const user = DB_USERS.find(u => u.email === email);
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký!' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
        return res.status(503).json({ success: false, message: 'Chức năng gửi OTP chưa được cấu hình!' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = bcrypt.hashSync(otp, 8);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    OTP_STORE.set(email, { otpHash, expiresAt });

    try {
        await transporter.sendMail({
            from: `"VocabMind Security" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Mã OTP Đổi Mật Khẩu - VocabMind Pro',
            html: `<h2>Mã OTP của bạn là: <b style="color: #10b981;">${otp}</b></h2>`
        });
        return res.json({ success: true, message: 'Mã OTP đã được gửi đến Gmail của bạn!' });
    } catch (err) {
        OTP_STORE.delete(email);
        console.error('Failed to send password reset OTP:', err);
        return res.status(500).json({ success: false, message: 'Không thể gửi OTP lúc này. Vui lòng thử lại sau!' });
    }
});

// API 5: Xác thực OTP & Đổi Mật Khẩu
app.post('/api/auth/change-password-otp', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const record = OTP_STORE.get(email);
    if (!record || Date.now() > record.expiresAt) {
        OTP_STORE.delete(email);
        return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn!' });
    }

    const isOtpValid = await bcrypt.compare(otp, record.otpHash);
    if (!isOtpValid) return res.status(400).json({ success: false, message: 'Mã OTP không chính xác!' });

    const user = DB_USERS.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    OTP_STORE.delete(email);

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