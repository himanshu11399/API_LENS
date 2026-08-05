/* ============================================
   APILens — Entry Point with Hash Router
   ============================================ */

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/auth.css';

// Modules
import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderForgotPassword } from './pages/forgot-password.js';
import { renderResetPassword } from './pages/reset-password.js';
import { initApp } from './app.js';
import { isAuthenticated } from './services/auth.js';

const root = document.querySelector('#app');

/**
 * Navigate to a view by updating the hash.
 * @param {string} view - route name
 */
function navigate(view) {
  window.location.hash = '#/' + view;
}

/**
 * Resolve the current hash to a view name.
 */
function resolveRoute() {
  const hash = window.location.hash.replace('#/', '').split('?')[0] || 'landing';
  return hash;
}

/**
 * Render the appropriate view based on the current route.
 */
function render() {
  let view = resolveRoute();

  root.innerHTML = '';
  root.style.opacity = '0';

  requestAnimationFrame(() => {
    try {
      switch (view) {
        case 'login':
          renderLogin(root, navigate);
          break;
        case 'signup':
          renderSignup(root, navigate);
          break;
        case 'forgot-password':
          renderForgotPassword(root, navigate);
          break;
        case 'reset-password':
          renderResetPassword(root, navigate);
          break;
        case 'workspace':
          initApp(root, () => navigate('landing'), navigate);
          break;
        case 'landing':
        default:
          renderLanding(root, () => navigate('workspace'), navigate);
          break;
      }
    } catch (err) {
      console.error('Error rendering page:', err);
    } finally {
      // Always restore opacity
      requestAnimationFrame(() => {
        root.style.transition = 'opacity 0.3s ease';
        root.style.opacity = '1';
      });
    }
  });
}

// Listen for hash changes
window.addEventListener('hashchange', render);

// Initial render
const params = new URLSearchParams(window.location.search);
if (params.get('app') === 'true') {
  navigate('workspace');
} else if (!window.location.hash || window.location.hash === '#/') {
  render(); // Will render landing by default
} else {
  render(); // Render whatever hash route is set
}
