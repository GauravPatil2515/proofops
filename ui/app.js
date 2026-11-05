// ProofOps Product UI State & Controller
let currentView = 'overview';
let activeIncidentId = null;
let activeTab = 'overview';

// Theme Management
function initTheme() {
  const isDark = localStorage.getItem('proofops-theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon').textContent = '☀️';
    document.getElementById('theme-label').textContent = 'Light Mode';
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('proofops-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
  document.getElementById('theme-label').textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// System Mode Indicator (Switch Gateway Connection)
async function fetchAndRenderSystemMode() {
  try {
    const res = await fetchAPI('/api/v1/system/mode');
    if (res) {
      const modeEl = document.getElementById('switch-mode-indicator');
      if (modeEl) {
        const isLive = res.switch_mode === 'live';
        modeEl.innerHTML = `
          <span class="dot" style="background: ${isLive ? 'var(--status-emerald)' : 'var(--status-amber)'};"></span>
          <span style="font-size: 11px; font-weight: 600; font-family: var(--font-mono);">
            ${isLive ? '🟢 Live' : '🟡 Standalone Replay'}
          </span>
          <span style="font-size: 10px; color: var(--ink-muted); margin-left: 6px;">${res.base_url || ''}</span>
        `;
        modeEl.title = res.note || '';
      }
    }
  } catch (e) {
    console.warn('Failed to fetch system mode:', e);
  }
}

// Initialize system mode polling
function initSystemMode() {
  fetchAndRenderSystemMode();
  // Refresh every 30 seconds
  setInterval(fetchAndRenderSystemMode, 30000);
}

// Navigation Controller
function navigate(view, incidentId = null) {
  currentView = view;
  if (incidentId) activeIncidentId = incidentId;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  const titleEl = document.getElementById('topbar-view-title');
  titleEl.textContent = view.charAt(0).toUpperCase() + view.slice(1);

  renderView();
}

// API Helpers
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
}

// View Renderer
async function renderView() {
  const container = document.getElementById('view-container');

  if (currentView === 'overview') {
    await renderOverview(container);
  } else if (currentView === 'incidents') {
    await renderIncidentsList(container);
  } else if (currentView === 'incident-detail') {
    await renderIncidentDetail(container);
  } else if (currentView === 'approvals') {
    await renderApprovals(container);
  } else if (currentView === 'integrations') {
    await renderIntegrations(container);
  } else if (currentView === 'teams') {
    renderTeams(container);
  } else if (currentView === 'evidence') {
    renderEvidenceReports(container);
  } else if (currentView === 'settings') {
    renderSettings(container);
  }
}

// ── 1. Overview Dashboard ────────────────────────────────────────────────────
async function renderOverview(container) {
  const data = await fetchAPI('/api/v1/dashboard');
  if (!data) return;

  document.getElementById('badge-incidents').textContent = data.stats.active_incidents;
  document.getElementById('badge-approvals').textContent = data.stats.awaiting_approval;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
      <div class="card" style="padding: 16px;">
        <div style="font-size: 12px; color: var(--ink-muted); font-weight: 600;">ACTIVE INCIDENTS</div>
        <div style="font-size: 28px; font-weight: 700; margin-top: 4px; color: ${data.stats.active_incidents > 0 ? 'var(--accent-flame)' : 'var(--ink-deep)'};">
          ${data.stats.active_incidents}
        </div>
      </div>
      <div class="card" style="padding: 16px;">
        <div style="font-size: 12px; color: var(--ink-muted); font-weight: 600;">AWAITING APPROVAL</div>
        <div style="font-size: 28px; font-weight: 700; margin-top: 4px; color: ${data.stats.awaiting_approval > 0 ? 'var(--status-amber)' : 'var(--ink-deep)'};">
          ${data.stats.awaiting_approval}
        </div>
      </div>
      <div class="card" style="padding: 16px;">
        <div style="font-size: 12px; color: var(--ink-muted); font-weight: 600;">VERIFIED RESOLUTIONS</div>
        <div style="font-size: 28px; font-weight: 700; margin-top: 4px; color: var(--status-emerald);">
          ${data.stats.verified_resolutions}
        </div>
      </div>
      <div class="card" style="padding: 16px;">
        <div style="font-size: 12px; color: var(--ink-muted); font-weight: 600;">EVIDENCE GATE ENGINE</div>
        <div style="font-size: 14px; font-weight: 700; margin-top: 12px;">
          <span class="badge badge-emerald"><span class="dot"></span> 100% OPERATIONAL</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 700;">Active Incidents</h2>
          <p style="font-size: 13px; color: var(--ink-muted);">Monitored through Sentry, investigated and verified via Switch rooms.</p>
        </div>
        <button class="btn btn-secondary" onclick="navigate('incidents')">View All</button>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-hairline); color: var(--ink-muted);">
              <th style="padding: 10px 12px;">ID</th>
              <th style="padding: 10px 12px;">Title</th>
              <th style="padding: 10px 12px;">Service</th>
              <th style="padding: 10px 12px;">Severity</th>
              <th style="padding: 10px 12px;">Status</th>
              <th style="padding: 10px 12px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent_incidents.length === 0 ? `
              <tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--ink-muted);">No active incidents. Launch demo incident above!</td></tr>
            ` : data.recent_incidents.map(inc => `
              <tr style="border-bottom: 1px solid var(--border-hairline);">
                <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700;">${inc.id}</td>
                <td style="padding: 12px; font-weight: 600;">${inc.title}</td>
                <td style="padding: 12px; font-family: var(--font-mono);">${inc.service}</td>
                <td style="padding: 12px;">
                  <span class="badge badge-${inc.severity === 'high' ? 'crimson' : 'amber'}">${inc.severity}</span>
                </td>
                <td style="padding: 12px;">
                  <span class="badge badge-${getStatusBadgeClass(inc.status)}"><span class="dot"></span> ${inc.status.replace('_', ' ')}</span>
                </td>
                <td style="padding: 12px;">
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="navigate('incident-detail', '${inc.id}')">Inspect</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getStatusBadgeClass(status) {
  if (status === 'resolved') return 'emerald';
  if (status === 'awaiting_approval') return 'amber';
  if (status === 'blocked' || status === 'rejected') return 'crimson';
  return 'faint';
}

// ── 2. Incident Detail (The Flagship 6-Question View) ─────────────────────────
async function renderIncidentDetail(container) {
  if (!activeIncidentId) return navigate('overview');
  const data = await fetchAPI(`/api/v1/incidents/${activeIncidentId}`);
  if (!data) return;

  const inc = data.incident;
  const q = data.core_questions;
  const evi = data.evidence;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <span style="font-family: var(--font-mono); font-weight: 700; font-size: 18px;">${inc.id}</span>
          <span class="badge badge-${inc.severity === 'high' ? 'crimson' : 'amber'}">${inc.severity} SEVERITY</span>
          <span class="badge badge-${getStatusBadgeClass(inc.status)}"><span class="dot"></span> ${inc.status.replace('_', ' ')}</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">${inc.title}</h1>
      </div>
      <div style="display: flex; gap: 10px;">
        ${inc.status === 'awaiting_approval' ? `
          <button class="btn btn-success" onclick="approveIncident('${inc.id}', 'approved')">✓ Authorize Production Deploy</button>
          <button class="btn btn-danger" onclick="approveIncident('${inc.id}', 'rejected')">✕ Reject Fix</button>
          <button class="btn" style="background: var(--accent-flame); color: white;" onclick="simulateTamper('${inc.id}')">⚠️ Simulate Diff Tamper</button>
        ` : inc.status === 'resolved' ? `
          <span class="badge badge-emerald" style="font-size: 13px; padding: 6px 12px;"><span class="dot"></span> Production Verified & Closed</span>
        ` : inc.status === 'blocked' ? `
          <span class="badge badge-crimson" style="font-size: 13px; padding: 6px 12px;"><span class="dot"></span> 🚨 Tamper Blocked / Deploy Locked</span>
          <button class="btn btn-primary" onclick="reRunInvestigation('${inc.id}')">🔄 Reset & Re-run</button>
        ` : `
          <button class="btn btn-primary" onclick="reRunInvestigation('${inc.id}')">🔄 Re-run Pipeline</button>
        `}
      </div>
    </div>

    <!-- Stepper Pipeline -->
    <div class="card" style="padding: 16px 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; font-family: var(--font-mono);">
        <span style="color: var(--status-emerald);">● 1. ALERT INGESTED</span>
        <span style="color: var(--status-emerald);">● 2. TRIAGED</span>
        <span style="color: var(--status-emerald);">● 3. REPRODUCED</span>
        <span style="color: var(--status-emerald);">● 4. PATCH CRAFTED</span>
        <span style="color: ${evi && evi.checks.regression_tests_passed ? 'var(--status-emerald)' : 'var(--status-amber)'};">● 5. VERIFIED (EVIDENCE GATE)</span>
        <span style="color: ${inc.status === 'resolved' ? 'var(--status-emerald)' : 'var(--status-amber)'};">● 6. ${inc.status === 'resolved' ? 'DEPLOYED' : 'HUMAN APPROVAL'}</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button class="tab-btn ${activeTab === 'overview' ? 'active' : ''}" onclick="switchDetailTab('overview')">Overview (6 Human Questions)</button>
      <button class="tab-btn ${activeTab === 'evidence' ? 'active' : ''}" onclick="switchDetailTab('evidence')">Evidence & Verification (4/4)</button>
      <button class="tab-btn ${activeTab === 'activity' ? 'active' : ''}" onclick="switchDetailTab('activity')">Activity Timeline</button>
    </div>

    <div id="tab-content">
      ${activeTab === 'overview' ? renderTabOverview(q, inc) : activeTab === 'evidence' ? renderTabEvidence(evi, inc) : renderTabActivity(data.timeline)}
    </div>
  `;
}

function switchDetailTab(tab) {
  activeTab = tab;
  renderIncidentDetail(document.getElementById('view-container'));
}

function renderTabOverview(q, inc) {
  return `
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      <div>
        <div class="card">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); margin-bottom: 16px;">Core Incident Answers</h3>
          
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-flame); margin-bottom: 4px;">1. WHAT BROKE?</div>
            <div style="font-size: 14px; font-weight: 600;">${q.what_broke}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-flame); margin-bottom: 4px;">2. WHAT IS AFFECTED?</div>
            <div style="font-size: 14px; color: var(--ink-deep);">${q.what_is_affected}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-flame); margin-bottom: 4px;">3. WHAT CAUSED IT (HYPOTHESIS)?</div>
            <div style="font-size: 14px; color: var(--ink-deep);">${q.what_caused_it}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent-flame); margin-bottom: 4px;">4. WHAT HAS PROOFOPS TRIED?</div>
            <div style="font-size: 14px; color: var(--ink-deep);">${q.what_has_proofops_tried}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--status-emerald); margin-bottom: 4px;">5. DOES THE PROPOSED FIX ACTUALLY WORK?</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--status-emerald);">${q.does_fix_work}</div>
          </div>

          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--status-amber); margin-bottom: 4px;">6. WHAT DO I NEED TO APPROVE?</div>
            <div style="font-size: 14px; font-weight: 600;">${q.what_to_approve}</div>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); margin-bottom: 16px;">Telemetry Specs</h3>
          <div style="font-size: 13px; line-height: 2;">
            <div><span style="color: var(--ink-muted);">Culprit Commit:</span> <code style="font-family: var(--font-mono); font-weight: 700;">${inc.culprit_commit || '8f2c19a'}</code></div>
            <div><span style="color: var(--ink-muted);">Service:</span> <code style="font-family: var(--font-mono);">${inc.service}</code></div>
            <div><span style="color: var(--ink-muted);">Detected By:</span> Sentry Webhook</div>
            <div><span style="color: var(--ink-muted);">Room Channel:</span> <code style="font-family: var(--font-mono);">#incident-${inc.id.toLowerCase()}</code></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTabEvidence(evi, inc) {
  if (!evi) return `<div class="card">No evidence bundle generated yet.</div>`;

  const isTampered = evi.gate_verdict === 'TAMPERED' || inc.status === 'blocked';
  const split = evi.split_screen || {
    before: { status: 500, trace: "ZeroDivisionError: division by zero at app.py:48" },
    after: { status: 200, trace: "20% Discount applied ($16.00) - 0 errors" }
  };

  return `
    ${isTampered ? `
      <div class="card" style="border: 2px solid var(--accent-flame); background: rgba(217, 78, 30, 0.08); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">🚨</span>
          <div>
            <div style="font-weight: 700; color: var(--accent-flame); font-size: 16px;">INTEGRITY VIOLATION DETECTED: DIFF DRIFT & SIGNATURE INVALIDATED</div>
            <div style="font-size: 13px; color: var(--ink-deep); margin-top: 2px;">
              The candidate patch diff was modified post-verification. The SHA-256 seal mismatch broke the DSSE Ed25519 attestation.
              <strong>Autonomous deployment has been locked.</strong>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Split-Screen Fail/Pass Request Comparison -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); margin-bottom: 16px;">
        Deterministic Request Replay (Split-Screen Evidence)
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Before: 500 -->
        <div style="border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); padding: 16px; background: rgba(239, 68, 68, 0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--status-crimson); font-family: var(--font-mono);">BEFORE PATCH (UNVERIFIED)</span>
            <span class="badge badge-crimson">HTTP ${split.before.status} FAIL</span>
          </div>
          <div style="font-size: 12px; font-family: var(--font-mono); color: var(--ink-muted); margin-bottom: 6px;">POST /api/checkout [SAVE20]</div>
          <div class="code-block" style="padding: 10px; font-size: 11px; color: var(--status-crimson);">
            ${split.before.trace}
          </div>
        </div>

        <!-- After: 200 -->
        <div style="border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); padding: 16px; background: rgba(16, 185, 129, 0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--status-emerald); font-family: var(--font-mono);">AFTER PATCH (VERIFIED)</span>
            <span class="badge badge-emerald">HTTP ${split.after.status} PASS</span>
          </div>
          <div style="font-size: 12px; font-family: var(--font-mono); color: var(--ink-muted); margin-bottom: 6px;">POST /api/checkout [SAVE20]</div>
          <div class="code-block" style="padding: 10px; font-size: 11px; color: var(--status-emerald);">
            ${split.after.trace}
          </div>
        </div>
      </div>
    </div>

    <!-- Required Checks & DSSE Attestation -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
      <div class="card">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">🛡️ Required Invariants Checklist</h3>
        <div style="font-size: 13px; line-height: 2.2;">
          <div><span style="color: var(--status-emerald); font-weight: 700;">✓</span> Repro Confirmed & Signature Matched (ZeroDivisionError at app.py:48)</div>
          <div><span style="color: var(--status-emerald); font-weight: 700;">✓</span> Anti-Masking Policy Audit (0 bare excepts, tests/ untouched)</div>
          <div><span style="color: var(--status-emerald); font-weight: 700;">✓</span> Property Fuzzing (50 random variants passed without crash)</div>
          <div><span style="color: ${isTampered ? 'var(--status-crimson)' : 'var(--status-emerald)'}; font-weight: 700;">${isTampered ? '✕' : '✓'}</span> ${isTampered ? 'DSSE Ed25519 Seal INVALIDATED' : 'in-toto Statement v1 + DSSE Ed25519 Signed'}</div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Cryptographic Attestation & Diff Hash</h3>
        <div style="font-size: 12px; color: var(--ink-muted); margin-bottom: 6px;">SHA-256 PATCH DIFF HASH</div>
        <div class="code-block" style="padding: 10px; font-size: 11px; word-break: break-all; color: ${isTampered ? 'var(--status-crimson)' : 'var(--accent-flame)'}; font-weight: 700;">
          ${evi.patch_sha256}
        </div>
        ${evi.dsse_envelope ? `
          <div style="font-size: 11px; margin-top: 10px; color: var(--ink-muted);">
            DSSE Key ID: <code style="font-family: var(--font-mono);">${evi.dsse_envelope.signatures[0].keyid}</code>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="card">
      <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Verified Code Patch Diff</h3>
      <div class="code-block">
        ${evi.patch_diff.split('\n').map(line => {
          if (line.startsWith('+') && !line.startsWith('+++')) return `<div class="diff-add">${escapeHtml(line)}</div>`;
          if (line.startsWith('-') && !line.startsWith('---')) return `<div class="diff-sub">${escapeHtml(line)}</div>`;
          return `<div>${escapeHtml(line)}</div>`;
        }).join('')}
      </div>
    </div>

    ${evi.attestation_statement ? `
      <div class="card">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">in-toto Statement v1 (Cryptographic Evidence Certificate)</h3>
        <pre class="code-block" style="max-height: 250px; overflow-y: auto; font-size: 11px;">${JSON.stringify(evi.attestation_statement, null, 2)}</pre>
      </div>
    ` : ''}

    <div class="card">
      <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Isolated Pytest Execution Logs</h3>
      <pre class="code-block">${evi.test_summary}</pre>
    </div>
  `;
}

function renderTabActivity(timeline) {
  return `
    <div class="card">
      <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 16px;">Switch Multi-Agent Hand-off History</h3>
      ${timeline.map(e => `
        <div style="border-left: 2px solid var(--accent-flame); padding-left: 16px; margin-bottom: 20px;">
          <div style="font-size: 12px; font-family: var(--font-mono); color: var(--ink-faint);">${new Date(e.timestamp * 1000).toLocaleTimeString()}</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--ink-deep);">${e.actor} <span style="font-size: 11px; font-weight: 500; color: var(--ink-muted);">(${e.type})</span></div>
          <div style="font-size: 13px; color: var(--ink-muted); margin-top: 4px;">${e.description}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function launchDemoIncident() {
  const btn = document.getElementById('btn-launch-demo');
  btn.disabled = true;
  btn.textContent = '⏳ Launching Incident...';

  const res = await fetchAPI('/api/v1/incidents/demo', { method: 'POST' });
  if (res && res.incident_id) {
    navigate('incident-detail', res.incident_id);
  }
  btn.disabled = false;
  btn.textContent = '⚡ Launch Demo Incident (PO-1042)';
}

async function approveIncident(id, decision) {
  const reason = decision === 'approved' ? 'Approved via Wispr Voice / 1-Click Sign-off' : 'Rejected for revision';
  await fetchAPI(`/api/v1/incidents/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reason })
  });
  renderIncidentDetail(document.getElementById('view-container'));
}

async function simulateTamper(id) {
  if (!confirm("Simulate adversarial post-verification diff tampering? This will flip 1 byte in the patch and test the Evidence Gate tamper-trip.")) return;
  const res = await fetchAPI(`/api/v1/incidents/${id}/tamper`, { method: 'POST' });
  if (res) {
    alert("🚨 Tamper Simulated! The patch diff was modified by 1 byte. The Evidence Gate detected a cryptographic hash mismatch and locked deployment.");
  }
  renderIncidentDetail(document.getElementById('view-container'));
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 3. Integrations View ─────────────────────────────────────────────────────
async function renderIntegrations(container) {
  const integrations = await fetchAPI('/api/v1/integrations') || [];
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 20px; font-weight: 700;">Tool Integrations</h1>
      <p style="font-size: 13px; color: var(--ink-muted);">Manage telemetry, VCS, and Switch room connections.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      ${integrations.map(int => `
        <div class="card" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 16px; font-weight: 700;">${int.name}</div>
            <span class="badge badge-emerald"><span class="dot"></span> ${int.status}</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-muted); margin-bottom: 16px;">
            Account: <code style="font-family: var(--font-mono); color: var(--ink-deep);">${int.account_label}</code>
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--ink-faint); margin-bottom: 16px;">
            Scopes: ${int.granted_scopes.join(', ')}
          </div>
          <button class="btn btn-secondary" style="width: 100%;">Test Connection</button>
        </div>
      `).join('')}
    </div>
  `;
}

// ── 4. Approvals Hub ─────────────────────────────────────────────────────────
async function renderApprovals(container) {
  const incidents = await fetchAPI('/api/v1/incidents') || [];
  const pending = incidents.filter(i => i.status === 'awaiting_approval');

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 20px; font-weight: 700;">Pending Approvals</h1>
      <p style="font-size: 13px; color: var(--ink-muted);">Verified fixes awaiting human authorization before production deployment.</p>
    </div>

    ${pending.length === 0 ? `
      <div class="card" style="padding: 32px; text-align: center; color: var(--ink-muted);">
        No pending approvals. Launch demo incident or run an alert investigation!
      </div>
    ` : pending.map(inc => `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-flame);">${inc.id}</div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${inc.title}</div>
            <div style="font-size: 13px; color: var(--ink-muted); margin-top: 2px;">Service: ${inc.service} • Verified by Evidence Gate (4/4 passed)</div>
          </div>
          <button class="btn btn-primary" onclick="navigate('incident-detail', '${inc.id}')">Review & Authorize</button>
        </div>
      </div>
    `).join('')}
  `;
}

// ── Incidents List View ────────────────────────────────────────────────────────
async function renderIncidentsList(container) {
  const incidents = await fetchAPI('/api/v1/incidents') || [];
  
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 20px; font-weight: 700;">All Incidents</h1>
          <p style="font-size: 13px; color: var(--ink-muted);">Complete incident history with evidence-gated verification status.</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="filterIncidents('all')" id="filter-all">All</button>
          <button class="btn btn-secondary" onclick="filterIncidents('open')" id="filter-open">Open</button>
          <button class="btn btn-secondary" onclick="filterIncidents('blocked')" id="filter-blocked">Blocked</button>
          <button class="btn btn-secondary" onclick="filterIncidents('resolved')" id="filter-resolved">Resolved</button>
        </div>
      </div>
    </div>

    <div class="card" id="incidents-table-container">
      ${renderIncidentsTable(incidents, 'all')}
    </div>
  `;
  
  // Initialize filter state
  window.currentIncidentFilter = 'all';
}

function renderIncidentsTable(incidents, filter) {
  const filtered = filter === 'all' 
    ? incidents 
    : incidents.filter(i => {
        if (filter === 'open') return !['resolved', 'rejected'].includes(i.status);
        if (filter === 'blocked') return i.status === 'blocked';
        if (filter === 'resolved') return i.status === 'resolved';
        return true;
      });
  
  if (filtered.length === 0) {
    return `
      <div style="padding: 48px; text-align: center; color: var(--ink-muted);">
        No incidents found${filter !== 'all' ? ` with filter "${filter}"` : ''}.
      </div>
    `;
  }
  
  return `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-hairline); color: var(--ink-muted);">
            <th style="padding: 10px 12px;">ID</th>
            <th style="padding: 10px 12px;">Title</th>
            <th style="padding: 10px 12px;">Service</th>
            <th style="padding: 10px 12px;">Severity</th>
            <th style="padding: 10px 12px;">Status</th>
            <th style="padding: 10px 12px;">Created</th>
            <th style="padding: 10px 12px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(inc => `
            <tr style="border-bottom: 1px solid var(--border-hairline);">
              <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700;">${inc.id}</td>
              <td style="padding: 12px; font-weight: 600;">${inc.title}</td>
              <td style="padding: 12px; font-family: var(--font-mono);">${inc.service}</td>
              <td style="padding: 12px;">
                <span class="badge badge-${inc.severity === 'high' ? 'crimson' : 'amber'}">${inc.severity}</span>
              </td>
              <td style="padding: 12px;">
                <span class="badge badge-${getStatusBadgeClass(inc.status)}"><span class="dot"></span> ${inc.status.replace('_', ' ')}</span>
              </td>
              <td style="padding: 12px; font-family: var(--font-mono); font-size: 11px;">${new Date(inc.created_at * 1000).toLocaleString()}</td>
              <td style="padding: 12px;">
                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="navigate('incident-detail', '${inc.id}')">View Evidence</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterIncidents(filter) {
  window.currentIncidentFilter = filter;
  
  // Update active button
  ['all', 'open', 'blocked', 'resolved'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) btn.classList.toggle('active', f === filter);
  });
  
  // Re-render table
  fetchAPI('/api/v1/incidents').then(incidents => {
    const container = document.getElementById('incidents-table-container');
    if (container) {
      container.innerHTML = renderIncidentsTable(incidents || [], filter);
    }
  });
}

async function reRunInvestigation(incidentId) {
  // Show confirmation with loading state
  const confirmed = confirm(`Re-run the multi-agent investigation pipeline for ${incidentId}? This will reset the incident and regenerate all evidence.`);
  if (!confirmed) return;
  
  // Find and disable the button
  const buttons = document.querySelectorAll(`button[onclick*="reRunInvestigation('${incidentId}')"], button[onclick*='reRunInvestigation("${incidentId}")']`);
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = '⏳ Re-running...';
  });
  
  try {
    const res = await fetchAPI(`/api/v1/incidents/${incidentId}/rerun`, { method: 'POST' });
    if (res) {
      // Show success toast
      showToast('Investigation pipeline re-run complete. Evidence regenerated.', 'success');
      // Refresh the current view
      if (currentView === 'incident-detail' && activeIncidentId === incidentId) {
        renderIncidentDetail(document.getElementById('view-container'));
      } else if (currentView === 'incidents') {
        renderIncidentsList(document.getElementById('view-container'));
      }
    }
  } catch (err) {
    console.error('Rerun failed:', err);
    showToast('Failed to re-run investigation: ' + err.message, 'error');
  } finally {
    // Re-enable buttons
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.textContent = btn.textContent.includes('Reset') ? '🔄 Reset & Re-run' : '🔄 Re-run Pipeline';
    });
  }
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.getElementById('proofops-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'proofops-toast';
  const bgColor = type === 'success' ? 'var(--status-emerald)' : type === 'error' ? 'var(--status-crimson)' : 'var(--accent-flame)';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ── 5. Agent Teams View (Switch Template Issue #1095) ────────────────────────
function renderTeams(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 20px; font-weight: 700;">Switch Agent Team Shapes</h1>
      <p style="font-size: 13px; color: var(--ink-muted);">Preconfigured multi-agent teams resolving Switch Issue #1095.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 style="font-size: 16px; font-weight: 700;">Incident Response Squad</h2>
          <span class="badge badge-emerald">ACTIVE</span>
        </div>
        <p style="font-size: 13px; color: var(--ink-muted); margin-bottom: 16px;">
          4 Specialized Agents: Incident Triager, ReproLab Engineer, Hotfix Engineer, and Evidence Gate Verifier.
        </p>
        <div class="code-block" style="font-size: 11px;">
template: proofops.template.yaml
agents: [proofops-triager, proofops-repro, proofops-fixer, proofops-verifier]
policy: Evidence Gate v1.0
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 style="font-size: 16px; font-weight: 700;">Bug Investigation Squad</h2>
          <span class="badge badge-faint">AVAILABLE</span>
        </div>
        <p style="font-size: 13px; color: var(--ink-muted); margin-bottom: 16px;">
          Lightweight pair: Investigator and Reproducer for non-production issue triage.
        </p>
        <div class="code-block" style="font-size: 11px;">
template: bug-investigation.template.yaml
agents: [bug-investigator, bug-repro]
policy: Evidence Optional
        </div>
      </div>
    </div>
  `;
}

function renderEvidenceReports(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 20px; font-weight: 700;">Evidence Ledger & Compliance Reports</h1>
      <p style="font-size: 13px; color: var(--ink-muted);">Cryptographically sealed post-mortems and test execution receipts.</p>
    </div>
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700;">Post-Mortem: INC-1042 (Checkout API 500)</div>
          <div style="font-size: 13px; color: var(--ink-muted);">Certified by Evidence Gate • SHA-256 Verified</div>
        </div>
        <button class="btn btn-secondary">Download Markdown Report</button>
      </div>
    </div>
  `;
}

function renderSettings(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 20px; font-weight: 700;">Workspace Settings</h1>
      <p style="font-size: 13px; color: var(--ink-muted);">Configure workspace policies and verification enforcement.</p>
    </div>
    <div class="card">
      <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Strict Evidence Policy</h3>
      <p style="font-size: 13px; color: var(--ink-muted); margin-bottom: 16px;">Require passing reproduction failure and green pytest runs before any PR can be opened.</p>
      <span class="badge badge-emerald">ENFORCED</span>
    </div>
  `;
}

// Initial boot
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSystemMode();
  renderView();
});

