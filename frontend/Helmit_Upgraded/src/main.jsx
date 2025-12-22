import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:5', message: 'main.jsx loaded', data: { rootExists: !!document.getElementById('root') }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
// #endregion
import App from './App.jsx'
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:8', message: 'App imported successfully', data: { appType: typeof App }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
// #endregion

try {
  const rootElement = document.getElementById('root');
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:12', message: 'Before createRoot', data: { rootExists: !!rootElement, rootId: rootElement?.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  // #endregion
  const root = createRoot(rootElement);
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:15', message: 'createRoot succeeded', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  // #endregion
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:22', message: 'render() called', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.jsx:25', message: 'ERROR in main.jsx', data: { error: error.message, stack: error.stack }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
  // #endregion
  console.error('Failed to render app:', error);
  throw error;
}
