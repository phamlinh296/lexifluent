const $ = (id) => document.getElementById(id);

function show(viewId) {
  ['view-loading', 'view-logged-in', 'view-logged-out'].forEach((id) => {
    $(id).classList.toggle('hidden', id !== viewId);
  });
}

async function init() {
  show('view-loading');

  const [statusRes, urlRes] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }),
    chrome.runtime.sendMessage({ type: 'GET_API_BASE' }),
  ]);

  const apiUrl = urlRes.url || 'http://localhost:8080';

  if (statusRes.loggedIn) {
    renderLoggedIn(apiUrl);
  } else {
    renderLoggedOut(apiUrl);
  }
}

function renderLoggedIn(apiUrl) {
  show('view-logged-in');
  $('api-url').value = apiUrl;

  $('btn-logout').onclick = async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    init();
  };

  $('btn-save-url').onclick = async () => {
    const url = $('api-url').value.trim().replace(/\/$/, '');
    if (!url) return;
    await chrome.runtime.sendMessage({ type: 'SET_API_BASE', url });
    const saved = $('url-saved');
    saved.classList.remove('hidden');
    setTimeout(() => saved.classList.add('hidden'), 1500);
  };
}

function renderLoggedOut(apiUrl) {
  show('view-logged-out');
  $('api-url-lo').value = apiUrl;

  $('btn-save-url-lo').onclick = async () => {
    const url = $('api-url-lo').value.trim().replace(/\/$/, '');
    if (!url) return;
    await chrome.runtime.sendMessage({ type: 'SET_API_BASE', url });
  };

  $('btn-login').onclick = doLogin;
  $('password').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
}

async function doLogin() {
  const email = $('email').value.trim();
  const password = $('password').value;
  const errorEl = $('login-error');
  const btn = $('btn-login');

  errorEl.classList.add('hidden');

  if (!email || !password) {
    showError('Nhập đủ email và mật khẩu.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Đang đăng nhập...';

  const res = await chrome.runtime.sendMessage({ type: 'LOGIN', email, password });

  if (!res.ok) {
    showError(res.error || 'Đăng nhập thất bại.');
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
    return;
  }

  init();

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }
}

init();
