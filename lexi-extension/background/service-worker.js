const API_BASE_KEY = 'lexi_api_base';
const DEFAULT_API = 'http://localhost:8080';

async function getApiBase() {
  const result = await chrome.storage.local.get(API_BASE_KEY);
  return result[API_BASE_KEY] || DEFAULT_API;
}

async function getTokens() {
  const result = await chrome.storage.local.get(['accessToken', 'refreshToken']);
  return { accessToken: result.accessToken || null, refreshToken: result.refreshToken || null };
}

async function setTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({ accessToken, refreshToken });
}

async function clearTokens() {
  await chrome.storage.local.remove(['accessToken', 'refreshToken']);
}

async function refreshAccessToken() {
  const apiBase = await getApiBase();
  const { refreshToken } = await getTokens();
  if (!refreshToken) throw new Error('Chưa đăng nhập');

  const res = await fetch(`${apiBase}/api/v1/auth/refresh?token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
    headers: { 'User-Agent': 'LexiFluent-Extension/1.0' },
  });

  if (!res.ok) {
    await clearTokens();
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
  }

  const data = await res.json();
  const auth = data.data;
  await setTokens(auth.accessToken, auth.refreshToken);
  return auth.accessToken;
}

async function apiFetch(path, options = {}) {
  const apiBase = await getApiBase();
  let { accessToken } = await getTokens();

  const doFetch = (token) =>
    fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'LexiFluent-Extension/1.0',
        ...options.headers,
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    accessToken = await refreshAccessToken();
    res = await doFetch(accessToken);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Lỗi ${res.status}`);
  }

  return res.json();
}

async function fetchDefinition(word) {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]) return null;
  const meaning = data[0].meanings?.[0];
  const def = meaning?.definitions?.[0]?.definition;
  const pos = meaning?.partOfSpeech;
  if (!def) return null;
  return pos ? `(${pos}) ${def}` : def;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'LOGIN': {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LexiFluent-Extension/1.0',
        },
        body: JSON.stringify({ email: msg.email, password: msg.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đăng nhập thất bại');
      await setTokens(data.data.accessToken, data.data.refreshToken);
      return {};
    }

    case 'LOGOUT': {
      await clearTokens();
      return {};
    }

    case 'GET_STATUS': {
      const { refreshToken } = await getTokens();
      return { loggedIn: !!refreshToken };
    }

    case 'CREATE_FLASHCARD': {
      await apiFetch('/api/v1/flashcards', {
        method: 'POST',
        body: JSON.stringify({ front: msg.front, back: msg.back, type: 'BASIC' }),
      });
      return {};
    }

    case 'GET_DEFINITION': {
      const def = await fetchDefinition(msg.word);
      return { definition: def };
    }

    case 'SET_API_BASE': {
      const url = msg.url.trim().replace(/\/$/, '');
      await chrome.storage.local.set({ [API_BASE_KEY]: url });
      return {};
    }

    case 'GET_API_BASE': {
      return { url: await getApiBase() };
    }

    default:
      throw new Error(`Unknown message: ${msg.type}`);
  }
}
