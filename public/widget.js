(function() {
  'use strict';

  // Widget Version 2.0 - with progress tracking
  const API_BASE = 'https://analyse.arsenio.at';
  const WIDGET_VERSION = '2.0.2';

  // Find the container
  const container = document.getElementById('arsenio-analyse');
  if (!container) {
    console.error('Arsenio Widget: Container #arsenio-analyse not found');
    return;
  }

  // Inject styles
  const styles = document.createElement('style');
  styles.textContent = `
    .arsenio-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    }
    .arsenio-widget * {
      box-sizing: border-box;
    }
    .arsenio-widget h3 {
      margin: 0 0 24px 0;
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
      text-align: center;
    }
    .arsenio-widget .aw-input-group {
      position: relative;
      margin-bottom: 16px;
    }
    .arsenio-widget .aw-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: #9ca3af;
    }
    .arsenio-widget input[type="text"],
    .arsenio-widget input[type="email"],
    .arsenio-widget input[type="url"] {
      width: 100%;
      padding: 14px 16px 14px 48px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 15px;
      color: #374151;
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .arsenio-widget input:focus {
      outline: none;
      border-color: #c026d3;
      box-shadow: 0 0 0 3px rgba(192, 38, 211, 0.1);
    }
    .arsenio-widget input::placeholder {
      color: #9ca3af;
    }
    .arsenio-widget .aw-checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 20px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .arsenio-widget .aw-checkbox-group input {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: #c026d3;
      cursor: pointer;
    }
    .arsenio-widget .aw-checkbox-group a {
      color: #c026d3;
      text-decoration: none;
    }
    .arsenio-widget .aw-checkbox-group a:hover {
      text-decoration: underline;
    }
    .arsenio-widget button {
      width: 100%;
      padding: 16px 24px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, #c026d3 0%, #a855f7 50%, #6366f1 100%);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .arsenio-widget button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
    }
    .arsenio-widget button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .arsenio-widget .aw-footer {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
      color: #9ca3af;
    }
    .arsenio-widget .aw-error {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
      display: none;
    }
    .arsenio-widget .aw-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: aw-spin 0.8s linear infinite;
    }
    @keyframes aw-spin {
      to { transform: rotate(360deg); }
    }

    /* Progress View Styles */
    .arsenio-widget .aw-progress {
      text-align: center;
      padding: 20px 0;
    }
    .arsenio-widget .aw-progress-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 8px 0;
    }
    .arsenio-widget .aw-progress-url {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      word-break: break-all;
    }
    .arsenio-widget .aw-progress-bar-container {
      background: #e5e7eb;
      border-radius: 10px;
      height: 8px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    .arsenio-widget .aw-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #c026d3, #a855f7, #6366f1);
      border-radius: 10px;
      transition: width 0.5s ease;
    }
    .arsenio-widget .aw-steps {
      text-align: left;
    }
    .arsenio-widget .aw-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      font-size: 14px;
      color: #9ca3af;
      border-bottom: 1px solid #f3f4f6;
    }
    .arsenio-widget .aw-step:last-child {
      border-bottom: none;
    }
    .arsenio-widget .aw-step.active {
      color: #7c3aed;
      font-weight: 500;
    }
    .arsenio-widget .aw-step.completed {
      color: #10b981;
    }
    .arsenio-widget .aw-step-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .arsenio-widget .aw-step.pending .aw-step-icon {
      background: #f3f4f6;
      color: #9ca3af;
    }
    .arsenio-widget .aw-step.active .aw-step-icon {
      background: #ede9fe;
      color: #7c3aed;
    }
    .arsenio-widget .aw-step.completed .aw-step-icon {
      background: #d1fae5;
      color: #10b981;
    }
    .arsenio-widget .aw-step-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ede9fe;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: aw-spin 0.8s linear infinite;
    }

    /* Success View */
    .arsenio-widget .aw-success {
      text-align: center;
      padding: 20px 0;
    }
    .arsenio-widget .aw-success-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .arsenio-widget .aw-success-icon svg {
      width: 32px;
      height: 32px;
      color: #fff;
    }
    .arsenio-widget .aw-success h4 {
      font-size: 20px;
      color: #1a1a2e;
      margin: 0 0 8px 0;
    }
    .arsenio-widget .aw-success p {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 20px 0;
    }
    .arsenio-widget .aw-scores {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .arsenio-widget .aw-score-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .arsenio-widget .aw-score-value {
      font-size: 24px;
      font-weight: 700;
    }
    .arsenio-widget .aw-score-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }
    .arsenio-widget .aw-score-good { color: #10b981; }
    .arsenio-widget .aw-score-medium { color: #f59e0b; }
    .arsenio-widget .aw-score-bad { color: #ef4444; }
  `;
  document.head.appendChild(styles);

  const steps = [
    { id: 'analyzing_performance', label: 'Performance analysieren' },
    { id: 'analyzing_seo', label: 'SEO & Sicherheit prüfen' },
    { id: 'checking_links', label: 'Links überprüfen' },
    { id: 'generating_report', label: 'KI erstellt Bericht' },
    { id: 'sending_email', label: 'E-Mail versenden' },
  ];

  function getScoreClass(score) {
    if (score >= 80) return 'aw-score-good';
    if (score >= 50) return 'aw-score-medium';
    return 'aw-score-bad';
  }

  // Create widget HTML
  container.innerHTML = `
    <div class="arsenio-widget">
      <!-- FORM VIEW -->
      <div id="aw-form-view">
        <h3>Kostenlose Website-Analyse starten</h3>
        <div class="aw-error" id="aw-error"></div>
        <form id="aw-form">
          <div class="aw-input-group">
            <svg class="aw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input type="text" id="aw-name" placeholder="Ihr Vorname" required>
          </div>
          <div class="aw-input-group">
            <svg class="aw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <input type="text" id="aw-website" placeholder="ihre-website.at" required>
          </div>
          <div class="aw-input-group">
            <svg class="aw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input type="email" id="aw-email" placeholder="ihre@email.at" required>
          </div>
          <div class="aw-checkbox-group">
            <input type="checkbox" id="aw-privacy" required>
            <label for="aw-privacy">
              Ich stimme der <a href="https://arsenio.at/datenschutz" target="_blank">Datenschutzerklärung</a> zu.
            </label>
          </div>
          <button type="submit" id="aw-submit">
            <span id="aw-btn-text">Jetzt kostenlos analysieren</span>
            <svg id="aw-btn-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>
        <div class="aw-footer">
          Keine Kreditkarte erforderlich. Ergebnis per E-Mail in 3 Minuten.
        </div>
      </div>

      <!-- PROGRESS VIEW -->
      <div id="aw-progress-view" style="display:none;">
        <div class="aw-progress">
          <h3 class="aw-progress-title">Analyse läuft...</h3>
          <p class="aw-progress-url" id="aw-progress-url"></p>
          <div class="aw-progress-bar-container">
            <div class="aw-progress-bar" id="aw-progress-bar" style="width: 0%"></div>
          </div>
          <div class="aw-steps" id="aw-steps">
            ${steps.map((step, i) => `
              <div class="aw-step pending" data-step="${step.id}">
                <div class="aw-step-icon">${i + 1}</div>
                <span>${step.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SUCCESS VIEW -->
      <div id="aw-success-view" style="display:none;">
        <div class="aw-success">
          <div class="aw-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h4>Analyse abgeschlossen!</h4>
          <p>Die Ergebnisse wurden an <strong id="aw-success-email"></strong> gesendet.</p>
          <div class="aw-scores" id="aw-scores"></div>
        </div>
      </div>
    </div>
  `;

  const formView = document.getElementById('aw-form-view');
  const progressView = document.getElementById('aw-progress-view');
  const successView = document.getElementById('aw-success-view');
  const form = document.getElementById('aw-form');
  const errorEl = document.getElementById('aw-error');
  const submitBtn = document.getElementById('aw-submit');
  const btnText = document.getElementById('aw-btn-text');
  const btnArrow = document.getElementById('aw-btn-arrow');

  let pollInterval = null;
  let currentLeadId = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('aw-name').value.trim();
    let websiteUrl = document.getElementById('aw-website').value.trim();
    const email = document.getElementById('aw-email').value.trim();
    const privacy = document.getElementById('aw-privacy').checked;

    if (!firstName || !websiteUrl || !email) {
      showError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (!privacy) {
      showError('Bitte stimmen Sie der Datenschutzerklärung zu.');
      return;
    }

    if (!websiteUrl.startsWith('http')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    setLoading(true);
    errorEl.style.display = 'none';

    try {
      console.log('[Arsenio Widget] Starting analysis for:', websiteUrl);

      // Start analysis - create lead
      const startResponse = await fetch(API_BASE + '/api/analyze/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, websiteUrl, email }),
      });

      const startData = await startResponse.json();
      console.log('[Arsenio Widget] Start response:', startData);

      if (!startResponse.ok) {
        throw new Error(startData.error || 'Ein Fehler ist aufgetreten');
      }

      // Switch to progress view
      currentLeadId = startData.leadId;
      document.getElementById('aw-progress-url').textContent = websiteUrl;
      document.getElementById('aw-success-email').textContent = email;

      formView.style.display = 'none';
      progressView.style.display = 'block';

      // Trigger process endpoint (fire and forget)
      console.log('[Arsenio Widget] Triggering process for leadId:', currentLeadId);
      fetch(API_BASE + '/api/analyze/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: currentLeadId }),
      }).then(r => console.log('[Arsenio Widget] Process triggered, status:', r.status))
        .catch(err => console.error('[Arsenio Widget] Process error:', err));

      // Start polling
      startPolling(email);

    } catch (error) {
      console.error('[Arsenio Widget] Error:', error);
      showError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  });

  function startPolling(email) {
    pollInterval = setInterval(async () => {
      try {
        const response = await fetch(API_BASE + '/api/analyze/' + currentLeadId + '/status');
        const data = await response.json();

        updateProgress(data);

        if (data.isCompleted) {
          clearInterval(pollInterval);
          showSuccess(data, email);
        } else if (data.isFailed) {
          clearInterval(pollInterval);
          showError('Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.');
          progressView.style.display = 'none';
          formView.style.display = 'block';
          setLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  }

  function updateProgress(data) {
    const progressBar = document.getElementById('aw-progress-bar');
    const progress = Math.round((data.step / data.totalSteps) * 100);
    progressBar.style.width = progress + '%';

    const stepEls = document.querySelectorAll('.aw-step');
    const currentStepIndex = steps.findIndex(s => s.id === data.status);

    stepEls.forEach((el, i) => {
      el.classList.remove('pending', 'active', 'completed');
      const iconEl = el.querySelector('.aw-step-icon');

      if (i < currentStepIndex) {
        el.classList.add('completed');
        iconEl.innerHTML = '✓';
      } else if (i === currentStepIndex) {
        el.classList.add('active');
        iconEl.innerHTML = '<div class="aw-step-spinner"></div>';
      } else {
        el.classList.add('pending');
        iconEl.innerHTML = i + 1;
      }
    });
  }

  function showSuccess(data, email) {
    progressView.style.display = 'none';
    successView.style.display = 'block';

    if (data.scores) {
      const scoresEl = document.getElementById('aw-scores');
      scoresEl.innerHTML = `
        <div class="aw-score-item">
          <div class="aw-score-value ${getScoreClass(data.scores.performanceMobile)}">${data.scores.performanceMobile}</div>
          <div class="aw-score-label">Performance</div>
        </div>
        <div class="aw-score-item">
          <div class="aw-score-value ${getScoreClass(data.scores.seo)}">${data.scores.seo}</div>
          <div class="aw-score-label">SEO</div>
        </div>
        <div class="aw-score-item">
          <div class="aw-score-value ${getScoreClass(data.scores.accessibility)}">${data.scores.accessibility}</div>
          <div class="aw-score-label">Barrierefreiheit</div>
        </div>
        <div class="aw-score-item">
          <div class="aw-score-value ${getScoreClass(data.scores.security)}">${data.scores.security}</div>
          <div class="aw-score-label">Sicherheit</div>
        </div>
      `;
    }
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      btnText.textContent = 'Wird gestartet...';
      btnArrow.style.display = 'none';
      submitBtn.insertAdjacentHTML('beforeend', '<div class="aw-spinner" id="aw-spinner"></div>');
    } else {
      btnText.textContent = 'Jetzt kostenlos analysieren';
      btnArrow.style.display = 'block';
      const spinner = document.getElementById('aw-spinner');
      if (spinner) spinner.remove();
    }
  }
})();
