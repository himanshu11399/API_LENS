/* ============================================
   APILens — Premium Landing Page
   ============================================ */

import { initHeroCanvas } from '../components/hero-canvas.js';
import { isAuthenticated } from '../services/auth.js';

/**
 * Render the landing page.
 * @param {HTMLElement} container
 * @param {Function} onStartApp - callback to navigate to workspace
 * @param {Function} navigate - hash router navigate function
 */
export function renderLanding(container, onStartApp, navigate) {
  container.innerHTML = `
    <div class="landing">
      <!-- Background Mesh and Textures -->
      <div class="landing-mesh-bg"></div>
      <div class="noise-overlay"></div>
      <div class="glow-blob glow-blob-1"></div>
      <div class="glow-blob glow-blob-2"></div>

      <!-- Navigation -->
      <nav class="landing-nav">
        <div class="landing-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
            <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="18" r="2" fill="white"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#3B82F6"/>
                <stop offset="1" stop-color="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
          <span>APILens</span>
        </div>
        <div class="landing-nav-links">
          <a href="#playground">Playground</a>
          <a href="#features">Features</a>
          <a href="#analytics">Analytics</a>
          ${isAuthenticated()
            ? '<button class="btn btn-primary btn-sm" id="nav-start-btn">Open App</button>'
            : `<button class="btn btn-ghost btn-sm" id="nav-login-btn">Sign In</button>
               <button class="btn btn-primary btn-sm" id="nav-signup-btn">Sign Up Free</button>`
          }
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-left scroll-reveal stagger-1">
          <div class="hero-badge">
            <span class="dot"></span>
            Zero installation. Fully browser-based.
          </div>
          <h1>Test APIs Instantly<br>in Your Browser</h1>
          <p class="hero-sub">
            No installation. No setup. Send requests, inspect responses, and analyze API performance in seconds.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="hero-start-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Testing Free
            </button>
            <button class="btn btn-secondary btn-lg" id="hero-demo-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              View Demo
            </button>
          </div>
          <div class="hero-features">
            <div class="hero-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Browser Based
            </div>
            <div class="hero-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Lightning Fast
            </div>
            <div class="hero-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Request Analytics
            </div>
          </div>
        </div>

        <div class="hero-right scroll-reveal stagger-2">
          <div class="hero-3d-container">
            <canvas class="hero-3d-canvas" id="hero-3d-canvas"></canvas>
          </div>
        </div>
      </section>

      <!-- Playground Showcase Section -->
      <section class="showcase-section scroll-reveal" id="playground">
        <h2>API Playground</h2>
        <p class="section-sub">Try sending a request directly below. Experience the speed of browser-based client execution.</p>

        <div class="playground-widget card-glass">
          <div class="playground-bar">
            <div class="playground-dots">
              <div class="playground-dot"></div>
              <div class="playground-dot"></div>
              <div class="playground-dot"></div>
            </div>
            <span class="playground-title">interactive_showcase_playground.js</span>
          </div>

          <div class="playground-content">
            <div class="playground-left">
              <div class="play-input-group">
                <span class="play-method">GET</span>
                <input type="text" class="play-url" value="https://api.apilens.com/v1/health-check" id="play-url-input">
                <button class="play-send-btn" id="play-send-btn">
                  <span>Send</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
              </div>

              <div class="play-tabs-bar">
                <span class="play-tab-active">Headers (3)</span>
                <span>Query Params</span>
                <span>Auth</span>
                <span>Body (JSON)</span>
              </div>

              <div class="play-editor-mock">
                <div style="color:var(--text-secondary); opacity:0.8;"><span style="color:var(--accent-purple);">Content-Type:</span> application/json</div>
                <div style="color:var(--text-secondary); opacity:0.8;"><span style="color:var(--accent-purple);">Accept:</span> */*</div>
                <div style="color:var(--text-secondary); opacity:0.8;"><span style="color:var(--accent-purple);">User-Agent:</span> APILens/BrowserClient-1.0</div>
              </div>

              <div class="sim-flow-container">
                <span class="sim-endpoint">Client</span>
                <div class="sim-flow-line">
                  <div class="sim-flow-dot" id="sim-flow-dot"></div>
                </div>
                <span class="sim-endpoint" style="color:var(--primary-neon);">APILens Server</span>
              </div>
            </div>

            <div class="playground-right">
              <div class="play-response-stats">
                <span>Response:</span>
                <span class="play-status-pill" id="play-status-pill">200 OK</span>
                <span id="play-latency">12ms</span>
                <span id="play-size">0.4 KB</span>
              </div>

              <div class="play-response-mock">
                <pre id="play-response-body" style="margin:0; font-family:inherit; color:var(--text-secondary);">Click "Send" to trigger the API request and view the response stream.</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section scroll-reveal" id="features">
        <h2>Everything You Need to Test APIs</h2>
        <p class="section-sub">A complete toolkit for modern API development, right in your browser.</p>

        <div class="features-grid">
          <div class="feature-card card-glass scroll-reveal stagger-1">
            <div class="feature-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3>API Testing</h3>
            <p>Send GET, POST, PUT, PATCH, DELETE requests. Real-time response inspection, cookie/header parsing, and browser-safe cookie overrides.</p>
          </div>
          <div class="feature-card card-glass scroll-reveal stagger-2">
            <div class="feature-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h3>Request History</h3>
            <p>Automatically keep track of all requests. Re-run or modify any historical request from the local offline ledger with a click.</p>
          </div>
          <div class="feature-card card-glass scroll-reveal stagger-3">
            <div class="feature-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>Collections</h3>
            <p>Group API requests into collections and folders. Export workspace structures as standard Postman/Hoppscotch compatible JSON format.</p>
          </div>
          <div class="feature-card card-glass scroll-reveal stagger-1">
            <div class="feature-icon yellow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z"/></svg>
            </div>
            <h3>Analytics Dashboard</h3>
            <p>Visualize latency over time, error rates, and throughput. Track API health and request metrics with production-quality dashboard views.</p>
          </div>
          <div class="feature-card card-glass scroll-reveal stagger-2">
            <div class="feature-icon cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h3>AI API Analysis</h3>
            <p>Get instant response explanations, debug stack traces, identify header misconfigurations, and receive intelligent fix recommendations.</p>
          </div>
          <div class="feature-card card-glass scroll-reveal stagger-3">
            <div class="feature-icon red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3>Code Generation</h3>
            <p>Auto-generate clean client code snippets in Javascript Fetch, Axios, Python Requests, cURL, Java, and Go on the fly.</p>
          </div>
        </div>
      </section>

      <!-- Analytics Showcase Section -->
      <section class="showcase-section scroll-reveal" id="analytics">
        <h2>Analytics Dashboard</h2>
        <p class="section-sub">Inspect response latency profiles, status distributions, and error frequencies visually.</p>

        <div class="analytics-widget">
          <div class="analytics-mini-metrics">
            <div class="analytics-mini-card">
              <div class="analytics-mini-label">Average Response Time</div>
              <div class="analytics-mini-value" data-target="42" id="val-avg-lat">0 ms</div>
              <div class="analytics-mini-trend">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                -12% since yesterday
              </div>
            </div>
            <div class="analytics-mini-card">
              <div class="analytics-mini-label">Success Rate</div>
              <div class="analytics-mini-value" data-target="99.94" id="val-success-rate">0%</div>
              <div class="analytics-mini-trend" style="color:var(--success);">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +0.02% health
              </div>
            </div>
            <div class="analytics-mini-card">
              <div class="analytics-mini-label">Total Volume</div>
              <div class="analytics-mini-value" data-target="8240" id="val-volume">0 reqs</div>
              <div class="analytics-mini-trend">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +14% traffic scale
              </div>
            </div>
          </div>

          <div class="analytics-mini-chart">
            <div class="analytics-chart-header">
              <span style="font-weight:600; color:var(--text); font-size:var(--text-sm);">Latency Over Time</span>
              <span style="font-size:10px; padding:2px 6px; background:rgba(255,255,255,0.05); border-radius:4px; color:var(--text-secondary);">Real-time stream</span>
            </div>
            <div class="analytics-chart-canvas-container">
              <canvas id="mini-analytics-canvas"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer scroll-reveal">
        <p>Built with ❤️ by developers, for developers. &copy; ${new Date().getFullYear()} APILens SaaS Platform. All rights reserved.</p>
      </footer>
    </div>
  `;

  // Initialize interactive 3D hero cube
  initHeroCanvas('hero-3d-canvas', '.hero-right');

  // Attach navigation listeners
  container.querySelector('#hero-start-btn').addEventListener('click', () => {
    if (navigate && !isAuthenticated()) navigate('signup');
    else onStartApp();
  });
  container.querySelector('#hero-demo-btn').addEventListener('click', onStartApp);

  // Conditional nav buttons
  const navStartBtn = container.querySelector('#nav-start-btn');
  const navLoginBtn = container.querySelector('#nav-login-btn');
  const navSignupBtn = container.querySelector('#nav-signup-btn');
  if (navStartBtn) navStartBtn.addEventListener('click', onStartApp);
  if (navLoginBtn) navLoginBtn.addEventListener('click', () => navigate('login'));
  if (navSignupBtn) navSignupBtn.addEventListener('click', () => navigate('signup'));

  // Playground simulation logic
  const playSendBtn = container.querySelector('#play-send-btn');
  const playFlowDot = container.querySelector('#sim-flow-dot');
  const playResponseBody = container.querySelector('#play-response-body');
  const playStatusPill = container.querySelector('#play-status-pill');
  const playLatency = container.querySelector('#play-latency');
  const playSize = container.querySelector('#play-size');

  const mockResponse = {
    status: "success",
    code: 200,
    timestamp: new Date().toISOString(),
    engine: {
      version: "2.4.1-stable",
      runtime: "APILens BrowserEngine",
      cors_proxied: false
    },
    metrics: {
      request_latency_ms: 12,
      response_bytes: 412
    },
    features: [
      "No downloads required",
      "Full CORS preflight compliance",
      "Local request history ledger",
      "Interactive analytics & graphing"
    ]
  };

  playSendBtn.addEventListener('click', () => {
    // Disable and trigger packet flow
    playSendBtn.disabled = true;
    playSendBtn.querySelector('span').textContent = 'Sending...';
    playFlowDot.classList.add('animating');
    playResponseBody.style.opacity = '0.4';

    setTimeout(() => {
      // Complete flow
      playFlowDot.classList.remove('animating');
      playSendBtn.disabled = false;
      playSendBtn.querySelector('span').textContent = 'Send';
      playResponseBody.style.opacity = '1';

      // Update mock response
      playResponseBody.innerHTML = syntaxHighlightJson(mockResponse);
      playStatusPill.style.display = 'inline-block';
      playLatency.textContent = '12ms';
      playSize.textContent = '0.4 KB';
    }, 1000);
  });

  // Intersection Observers for Scroll Reveal Animations
  const revealElements = container.querySelectorAll('.scroll-reveal');
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        
        // If it's the analytics section, trigger the number counting and chart animations
        if (entry.target.id === 'analytics') {
          triggerCounterAnimations(entry.target);
          triggerCanvasChartAnimation('mini-analytics-canvas');
        }
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => scrollObserver.observe(el));
}

// Simple JSON syntax highlighter helper
function syntaxHighlightJson(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    
    // Inline color highlights mirroring variable color themes
    if (cls === 'key') return `<span style="color:#60A5FA; font-weight:600;">${match}</span>`;
    if (cls === 'string') return `<span style="color:#10B981;">${match}</span>`;
    if (cls === 'number') return `<span style="color:#F59E0B;">${match}</span>`;
    if (cls === 'boolean') return `<span style="color:#A78BFA; font-weight:bold;">${match}</span>`;
    return `<span style="color:#94A3B8;">${match}</span>`;
  });
}

// Trigger count-up numbers when analytics section is in view
function triggerCounterAnimations(analyticsSection) {
  const avgLat = analyticsSection.querySelector('#val-avg-lat');
  const successRate = analyticsSection.querySelector('#val-success-rate');
  const volume = analyticsSection.querySelector('#val-volume');

  animateCount(avgLat, 0, parseFloat(avgLat.dataset.target), 1200, ' ms');
  animateCount(successRate, 0, parseFloat(successRate.dataset.target), 1500, '%', 2);
  animateCount(volume, 0, parseFloat(volume.dataset.target), 1800, ' reqs');
}

function animateCount(element, start, end, duration, suffix = '', decimals = 0) {
  if (element.classList.contains('counted')) return;
  element.classList.add('counted');

  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = start + progress * (end - start);
    element.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }
  window.requestAnimationFrame(step);
}

// Trigger responsive canvas latency curve animation
function triggerCanvasChartAnimation(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.classList.contains('drawn')) return;
  canvas.classList.add('drawn');

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const points = [45, 62, 38, 52, 74, 48, 58, 42, 39, 41, 35, 42];
  let progress = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = (height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.beginPath();
    const stepX = width / (points.length - 1);
    
    // Draw Area under Spline with gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.moveTo(0, height);
    for (let i = 0; i < points.length * progress; i++) {
      const x = i * stepX;
      // Map latency point to canvas height (range 20 to 90 ms)
      const ratio = (points[i] - 25) / 60;
      const y = height - (ratio * (height - 40) + 20);
      
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        // Curve fit calculation
        const prevRatio = (points[i-1] - 25) / 60;
        const prevY = height - (prevRatio * (height - 40) + 20);
        const cpX1 = x - stepX / 2;
        const cpY1 = prevY;
        const cpX2 = x - stepX / 2;
        const cpY2 = y;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
      }
    }
    const lastIdx = Math.min(Math.floor(points.length * progress), points.length - 1);
    const lastX = lastIdx * stepX;
    ctx.lineTo(lastX, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Spline Line path
    ctx.beginPath();
    for (let i = 0; i < points.length * progress; i++) {
      const x = i * stepX;
      const ratio = (points[i] - 25) / 60;
      const y = height - (ratio * (height - 40) + 20);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevRatio = (points[i-1] - 25) / 60;
        const prevY = height - (prevRatio * (height - 40) + 20);
        const cpX1 = x - stepX / 2;
        const cpY1 = prevY;
        const cpX2 = x - stepX / 2;
        const cpY2 = y;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
      }
    }
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(96, 165, 250, 0.4)';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw active pulse coordinate dot on the last loaded segment point
    if (lastIdx > 0) {
      const ratio = (points[lastIdx] - 25) / 60;
      const dotY = height - (ratio * (height - 40) + 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(lastX, dotY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (progress < 1) {
      progress += 0.02;
      requestAnimationFrame(draw);
    }
  }

  requestAnimationFrame(draw);
}
