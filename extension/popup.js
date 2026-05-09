document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const mainSection = document.getElementById('main-section');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const scanBtn = document.getElementById('scan-btn');
  const scanUrlInput = document.getElementById('scan-url');
  const scanResult = document.getElementById('scan-result');
  const loginError = document.getElementById('login-error');
  const userInfo = document.getElementById('user-info');
  const lastScanSection = document.getElementById('last-scan-section');
  const lastScanInfo = document.getElementById('last-scan-info');
  const statusDot = document.getElementById('status-dot');
  const alertsList = document.getElementById('alerts-list');

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  function mapVerdict(riskLevel) {
    if (riskLevel === 'safe' || riskLevel === 'low') return { label: 'Safe \u2705', cls: 'safe' };
    if (riskLevel === 'medium') return { label: 'Suspicious \u26A0\uFE0F', cls: 'suspicious' };
    return { label: 'Malicious! \uD83D\uDC80', cls: 'malicious' };
  }

  function showResult(data) {
    const v = mapVerdict(data.risk_level);
    scanResult.className = 'result ' + v.cls;
    scanResult.innerHTML =
      v.label +
      '<div class="detail">Confidence: ' + Math.round(data.confidence * 100) + '% \u00B7 ' + data.threat_category + '</div>';
    scanResult.classList.remove('hidden');

    // Add to alerts tab
    addAlert(data);
  }

  function addAlert(data) {
    const v = mapVerdict(data.risk_level);
    const dotCls = v.cls === 'safe' ? 'safe' : v.cls === 'suspicious' ? 'warning' : 'danger';
    // Remove empty message
    const empty = alertsList.querySelector('.empty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'alert-item';
    item.innerHTML =
      '<div class="alert-dot ' + dotCls + '"></div>' +
      '<div class="alert-url">' + data.url + '</div>' +
      '<div class="alert-time">now</div>';
    alertsList.prepend(item);
  }

  // Check login status
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
    if (res && res.loggedIn) {
      showLoggedIn(res.user, res.lastScan);
    } else {
      loginSection.classList.remove('hidden');
      mainSection.style.display = 'none';
      statusDot.style.background = 'var(--text-muted)';
    }
  });

  function showLoggedIn(user, lastScan) {
    loginSection.classList.add('hidden');
    mainSection.style.display = 'flex';
    mainSection.classList.remove('hidden');
    userInfo.textContent = user ? 'Signed in as ' + user.email : 'Signed in';
    statusDot.style.background = 'var(--safe)';
    if (lastScan) showLastScan(lastScan);
  }

  function showLastScan(data) {
    const v = mapVerdict(data.risk_level);
    lastScanInfo.innerHTML =
      '<span style="word-break:break-all;">' + data.url + '</span><br/>' +
      '<strong style="color:var(--' + (v.cls === 'safe' ? 'safe' : v.cls === 'suspicious' ? 'warning' : 'danger') + ')">' + v.label + '</strong>' +
      ' (' + Math.round(data.confidence * 100) + '%)';
    lastScanSection.style.display = 'block';
  }

  // Login
  loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) return;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    loginError.classList.add('hidden');

    chrome.runtime.sendMessage({ type: 'LOGIN', email, password }, (res) => {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
      if (res && res.ok) {
        showLoggedIn({ email }, null);
      } else {
        loginError.textContent = (res && res.error) || 'Login failed';
        loginError.classList.remove('hidden');
      }
    });
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
      mainSection.style.display = 'none';
      loginSection.classList.remove('hidden');
      scanResult.classList.add('hidden');
      lastScanSection.style.display = 'none';
      statusDot.style.background = 'var(--text-muted)';
    });
  });

  // Manual scan
  scanBtn.addEventListener('click', () => {
    const url = scanUrlInput.value.trim();
    if (!url) return;

    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
    scanResult.classList.add('hidden');

    chrome.runtime.sendMessage({ type: 'SCAN', url }, (res) => {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Scan';
      if (res && res.ok) {
        showResult(res.data);
      } else {
        scanResult.className = 'result malicious';
        scanResult.innerHTML = 'Error: ' + ((res && res.error) || 'Scan failed');
        scanResult.classList.remove('hidden');
      }
    });
  });

  // Pre-fill with current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
      scanUrlInput.value = tabs[0].url;
    }
  });
});
