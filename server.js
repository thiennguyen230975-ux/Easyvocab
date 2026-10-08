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

// ==========================================
// 2. FRONTEND HTML ROUTE (Google & Facebook Auth)
// ==========================================

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="vi" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocabMind Pro Single File</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Google & Facebook SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: { colors: { brand: { 50: '#eef2ff', 500: '#6366f1', 600: '#4f46e5' } } } }
    }
  </script>
  <style>
    .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
    .dark .glass { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); }
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-full flex flex-col font-sans">

  <header class="sticky top-0 z-40 glass border-b border-slate-200/50 dark:border-slate-800/50">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-extrabold text-xl">V</div>
        <span class="font-extrabold text-xl">VocabMind Multi-Auth</span>
      </div>
      <nav class="hidden md:flex gap-2">
        <button onclick="switchTab('analytics')" class="px-3 py-2 rounded-lg text-sm font-medium">Thống kê</button>
        <button onclick="switchTab('library')" class="px-3 py-2 rounded-lg text-sm font-medium">Từ vựng</button>
        <button onclick="switchTab('flashcards')" class="px-3 py-2 rounded-lg text-sm font-medium">Flashcards</button>
        <button id="navAdminInspector" onclick="switchTab('cookie-inspector')" class="hidden px-3 py-2 rounded-lg text-sm font-bold bg-purple-100 text-purple-700">Admin Inspector</button>
      </nav>
      <div id="authBox" class="flex items-center gap-2"></div>
    </div>
  </header>

  <main class="flex-1 max-w-7xl w-full mx-auto p-6">
    <section id="tab-analytics" class="tab-content space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass p-5 rounded-2xl"><div class="text-xs text-slate-500">Tổng từ vựng</div><div class="text-3xl font-bold">2</div></div>
        <div class="glass p-5 rounded-2xl border-l-4 border-emerald-500"><div class="text-xs text-slate-500">Thành thục</div><div class="text-3xl font-bold text-emerald-600">1</div></div>
        <div class="glass p-5 rounded-2xl border-l-4 border-amber-500"><div class="text-xs text-slate-500">Đang học</div><div class="text-3xl font-bold text-amber-600">1</div></div>
      </div>
      <div class="glass p-6 rounded-2xl h-64"><canvas id="srsPieChart"></canvas></div>
    </section>

    <section id="tab-library" class="tab-content hidden space-y-4">
      <div class="glass rounded-2xl overflow-hidden p-4">
        <table class="w-full text-left text-sm">
          <thead><tr><th class="p-2">Từ</th><th class="p-2">Nghĩa</th><th class="p-2">Phiên âm</th></tr></thead>
          <tbody id="vocabTableBody"></tbody>
        </table>
      </div>
    </section>

    <section id="tab-flashcards" class="tab-content hidden max-w-md mx-auto">
      <div class="perspective-1000 w-full h-64 cursor-pointer" onclick="flipCard()">
        <div id="cardInner" class="transform-style-3d transition-transform duration-500 relative w-full h-full rounded-2xl glass flex items-center justify-center p-6 text-center">
          <div class="absolute inset-0 backface-hidden flex flex-col justify-center items-center">
            <h2 class="text-3xl font-bold">Resilient</h2>
            <p class="text-slate-400 italic">/rɪˈzɪl.jənt/</p>
          </div>
          <div class="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
            <h2 class="text-2xl font-bold">Kiên cường</h2>
          </div>
        </div>
      </div>
    </section>

    <section id="tab-cookie-inspector" class="tab-content hidden">
      <pre id="adminInspectorJSON" class="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs overflow-x-auto"></pre>
    </section>
  </main>

  <!-- MODAL LOGIN DỰ ÁN (GOOGLE + FACEBOOK) -->
  <div id="loginModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center hidden p-4 z-50">
    <div class="glass max-w-md w-full p-6 rounded-2xl space-y-4 relative">
      <button onclick="closeLoginModal()" class="absolute top-4 right-4"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="text-xl font-bold text-center">Đăng Nhập</h3>
      
      <!-- Nút Đăng Nhập Google & Facebook -->
      <div class="space-y-2">
        <div class="flex justify-center">
          <div id="g_id_onload" data-client_id="${GOOGLE_CLIENT_ID}" data-callback="handleGoogleCredentialResponse"></div>
          <div class="g_id_signin w-full" data-type="standard"></div>
        </div>

        <fb:login-button
          scope="public_profile,email"
          onlogin="checkLoginState();"
          data-size="large">
        </fb:login-button>
      </div>

      <div class="relative flex py-1 items-center">
        <div class="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
        <span class="flex-shrink mx-3 text-xs text-slate-400 uppercase font-semibold">Hoặc dùng Mật Khẩu</span>
        <div class="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
      </div>

      <form onsubmit="handleLogin(event)" class="space-y-3">
        <input type="text" id="loginUsername" placeholder="Tài khoản / Gmail" required class="w-full px-3 py-2 border rounded-xl dark:bg-slate-900 text-sm">
        <input type="password" id="loginPassword" placeholder="Mật khẩu" required class="w-full px-3 py-2 border rounded-xl dark:bg-slate-900 text-sm">
        <div class="text-right"><button type="button" onclick="openResetModal()" class="text-xs text-indigo-600 font-bold">Quên / Đổi mật khẩu?</button></div>
        <button type="submit" class="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Đăng nhập</button>
      </form>
    </div>
  </div>

  <!-- MODAL RESET OTP -->
  <div id="resetModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center hidden p-4 z-50">
    <div class="glass max-w-md w-full p-6 rounded-2xl space-y-4 relative">
      <button onclick="closeResetModal()" class="absolute top-4 right-4"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="text-xl font-bold text-center">Đổi Mật Khẩu qua OTP</h3>
      
      <div class="space-y-3">
        <div class="flex gap-2">
          <input type="email" id="resetEmail" placeholder="Gmail đã đăng ký" class="w-full px-3 py-2 border rounded-xl dark:bg-slate-900 text-sm">
          <button onclick="sendOtp()" class="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl whitespace-nowrap">Gửi OTP</button>
        </div>
        <input type="text" id="resetOtp" placeholder="Mã OTP (6 số)" maxlength="6" class="w-full px-3 py-2 border rounded-xl text-center font-mono text-sm dark:bg-slate-900">
        <input type="password" id="resetNewPassword" placeholder="Mật khẩu mới" class="w-full px-3 py-2 border rounded-xl dark:bg-slate-900 text-sm">
        <button onclick="submitResetOtp()" class="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm">Xác Nhận Đổi Mật Khẩu</button>
      </div>
    </div>
  </div>

  <script>
    let currentUser = null;
    let authStatusPromise = null;
    let skipFacebookAutoLogin = sessionStorage.getItem('skipFacebookAutoLogin') === 'true';
    const vocabList = [
      { word: 'Resilient', meaning: 'Kiên cường', phonetic: '/rɪˈzɪl.jənt/' },
      { word: 'Meticulous', meaning: 'Tỉ mỉ', phonetic: '/məˈtɪk.jə.ləs/' }
    ];

    // Khởi tạo Facebook SDK
    const facebookAppId = ${JSON.stringify(FACEBOOK_APP_ID)};
    window.fbAsyncInit = function() {
      FB.init({
        appId      : facebookAppId,
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
      FB.AppEvents.logPageView();
      checkAuthStatus().then(() => {
        if (!currentUser && !skipFacebookAutoLogin) {
          FB.getLoginStatus(handleFacebookLoginStatus);
        }
      });
    };

    if (facebookAppId) {
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }

    document.addEventListener('DOMContentLoaded', () => {
      checkAuthStatus();
      renderTable();
      initChart();
    });

    function checkAuthStatus() {
      if (!authStatusPromise) {
        authStatusPromise = (async () => {
          try {
            const res = await fetch('/api/me');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra trạng thái đăng nhập.');
            currentUser = data.loggedIn ? data.user : null;
          } catch (error) {
            console.error('Không thể kiểm tra phiên đăng nhập:', error);
          }
          updateUI();
        })();
      }
      return authStatusPromise;
    }

    function updateUI() {
      const authBox = document.getElementById('authBox');
      const adminNav = document.getElementById('navAdminInspector');
      if (currentUser) {
        authBox.innerHTML = \`
          <span class="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">\${currentUser.username} (\${currentUser.role})</span>
          <button onclick="handleLogout()" class="px-2 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-lg">Thoát</button>
        \`;
        if (currentUser.role === 'admin') adminNav.classList.remove('hidden');
        else adminNav.classList.add('hidden');
      } else {
        adminNav.classList.add('hidden');
        authBox.innerHTML = \`<button onclick="openLoginModal()" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl">Đăng nhập</button>\`;
      }
    }

    // Xử lý Đăng Nhập Facebook Client
    function handleFacebookLoginStatus(response) {
      if (response.status === 'connected' && response.authResponse) {
        authenticateFacebookAccessToken(response.authResponse.accessToken);
      }
    }

    function checkLoginState() {
      FB.getLoginStatus(handleFacebookLoginStatus);
    }

    async function authenticateFacebookAccessToken(accessToken) {
      try {
        const res = await fetch('/api/auth/facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Đăng nhập Facebook thất bại!');
        }
        currentUser = data.user;
        skipFacebookAutoLogin = false;
        sessionStorage.removeItem('skipFacebookAutoLogin');
        closeLoginModal();
        updateUI();
      } catch (error) {
        console.error('Không thể xác thực phiên Facebook:', error);
        alert(error.message || 'Không thể đăng nhập bằng Facebook lúc này.');
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value;
      const p = document.getElementById('loginPassword').value;
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
      const data = await res.json();
      if (data.success) { currentUser = data.user; closeLoginModal(); updateUI(); alert('Đăng nhập thành công!'); }
      else alert(data.message);
    }

    async function handleGoogleCredentialResponse(response) {
      const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) });
      const data = await res.json();
      if (data.success) { currentUser = data.user; closeLoginModal(); updateUI(); alert('Đăng nhập Google thành công!'); }
      else alert(data.message);
    }

    async function sendOtp() {
      const email = document.getElementById('resetEmail').value;
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      alert(data.message);
    }

    async function submitResetOtp() {
      const email = document.getElementById('resetEmail').value;
      const otp = document.getElementById('resetOtp').value;
      const newPassword = document.getElementById('resetNewPassword').value;
      const res = await fetch('/api/auth/change-password-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, newPassword }) });
      const data = await res.json();
      alert(data.message);
      if (data.success) closeResetModal();
    }

    async function handleLogout() {
      await fetch('/api/logout', { method: 'POST' });
      currentUser = null;
      skipFacebookAutoLogin = true;
      sessionStorage.setItem('skipFacebookAutoLogin', 'true');
      updateUI();
      switchTab('analytics');
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-' + tabId).classList.remove('hidden');
      if (tabId === 'cookie-inspector') {
        fetch('/api/admin/cookie-inspector').then(r => r.json()).then(d => {
          document.getElementById('adminInspectorJSON').innerText = JSON.stringify(d, null, 2);
        });
      }
    }

    function renderTable() {
      document.getElementById('vocabTableBody').innerHTML = vocabList.map(i => \`<tr><td class="p-2 font-bold">\${i.word}</td><td class="p-2">\${i.meaning}</td><td class="p-2 text-slate-400 italic">\${i.phonetic}</td></tr>\`).join('');
    }

    function flipCard() { document.getElementById('cardInner').classList.toggle('rotate-y-180'); }
    function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
    function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
    function openResetModal() { closeLoginModal(); document.getElementById('resetModal').classList.remove('hidden'); }
    function closeResetModal() { document.getElementById('resetModal').classList.add('hidden'); }

    function initChart() {
      new Chart(document.getElementById('srsPieChart'), { type: 'doughnut', data: { labels: ['Thành thục', 'Đang học'], datasets: [{ data: [1, 1], backgroundColor: ['#10b981', '#f59e0b'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
  </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server VocabMind Multi-Auth đang chạy tại: http://localhost:${PORT}`);
});