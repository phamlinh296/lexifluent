let popup = null;

document.addEventListener('mouseup', (e) => {
  if (popup && popup.contains(e.target)) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text || text.length < 2 || text.length > 300) {
    if (!popup?.contains(e.target)) removePopup();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  removePopup();
  showPopup(text, rect);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') removePopup();
});

function removePopup() {
  popup?.remove();
  popup = null;
}

function showPopup(selectedText, rect) {
  popup = document.createElement('div');
  popup.className = 'lexi-popup';

  const isSingleWord = !/\s/.test(selectedText);

  popup.innerHTML = `
    <div class="lexi-inner">
      <div class="lexi-header">
        <span class="lexi-brand">LexiFluent</span>
        <button class="lexi-close" aria-label="Đóng">✕</button>
      </div>
      <div class="lexi-front">${escapeHtml(selectedText)}</div>
      ${isSingleWord ? '<div class="lexi-hint">Đang tra từ điển...</div>' : '<div class="lexi-hint">Nhập nghĩa cho cụm từ này</div>'}
      <textarea class="lexi-back" placeholder="Nghĩa / định nghĩa..." rows="2" spellcheck="false"></textarea>
      <button class="lexi-btn">+ Thêm vào Flashcard</button>
      <div class="lexi-msg"></div>
    </div>
  `;

  positionPopup(popup, rect);
  document.body.appendChild(popup);

  const backEl = popup.querySelector('.lexi-back');
  const addBtn = popup.querySelector('.lexi-btn');
  const msgEl = popup.querySelector('.lexi-msg');
  const hintEl = popup.querySelector('.lexi-hint');

  popup.querySelector('.lexi-close').onclick = removePopup;

  addBtn.onclick = async () => {
    const back = backEl.value.trim();
    if (!back) {
      showMsg('Nhập nghĩa trước nhé!', 'error');
      return;
    }

    addBtn.disabled = true;
    addBtn.textContent = 'Đang lưu...';
    clearMsg();

    const res = await chrome.runtime.sendMessage({
      type: 'CREATE_FLASHCARD',
      front: selectedText,
      back,
    });

    if (!res?.ok) {
      const errMsg = res?.error;
      const msg = errMsg?.includes('đăng nhập') || errMsg?.includes('hạn')
        ? 'Phiên hết hạn — mở extension để đăng nhập lại'
        : errMsg || 'Lỗi không xác định';
      showMsg(msg, 'error');
      addBtn.disabled = false;
      addBtn.textContent = '+ Thêm vào Flashcard';
      return;
    }

    showMsg('Đã lưu! ✓', 'success');
    setTimeout(removePopup, 1000);
  };

  backEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBtn.click();
    }
  });

  if (isSingleWord) {
    chrome.runtime.sendMessage({ type: 'GET_DEFINITION', word: selectedText }).then((res) => {
      if (!popup) return;
      hintEl.textContent = '';
      if (res.ok && res.definition) {
        backEl.value = res.definition;
        backEl.select();
      }
    });
  }

  backEl.focus();

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = `lexi-msg lexi-msg-${type}`;
  }

  function clearMsg() {
    msgEl.textContent = '';
    msgEl.className = 'lexi-msg';
  }
}

function positionPopup(el, rect) {
  const margin = 8;
  const popupWidth = 300;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const vpWidth = document.documentElement.clientWidth;

  let left = scrollX + rect.left;
  if (left + popupWidth + margin > scrollX + vpWidth) {
    left = scrollX + vpWidth - popupWidth - margin;
  }
  left = Math.max(scrollX + margin, left);

  el.style.cssText = `
    position: absolute;
    top: ${scrollY + rect.bottom + margin}px;
    left: ${left}px;
    width: ${popupWidth}px;
    z-index: 2147483647;
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
