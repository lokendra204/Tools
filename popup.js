const toggleBtn = document.getElementById('toggleBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Get current tab and check state
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0].id;

  // Check if annotator is active on this tab
  chrome.tabs.sendMessage(tabId, { type: 'GET_STATE' }, (resp) => {
    if (chrome.runtime.lastError) return;
    if (resp && resp.active) setUI(true);
    else setUI(false);
  });
});

toggleBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE' }, (resp) => {
      if (chrome.runtime.lastError) return;
      if (resp) setUI(resp.active);
    });
  });
});

function setUI(active) {
  if (active) {
    toggleBtn.textContent = '⏹ Deactivate';
    toggleBtn.classList.add('active');
    statusDot.classList.add('on');
    statusText.textContent = 'ACTIVE';
  } else {
    toggleBtn.textContent = '⚡ Activate on This Page';
    toggleBtn.classList.remove('active');
    statusDot.classList.remove('on');
    statusText.textContent = 'INACTIVE';
  }
}
