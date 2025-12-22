import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.jsx:2', message: 'App.jsx importing components', data: { pathname: window.location.pathname }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import ChatPage from './pages/Chatpage'
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.jsx:5', message: 'ChatPage imported', data: { chatPageType: typeof ChatPage }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import Forecast from './pages/Forecast'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.jsx:12', message: 'App component rendering', data: { pathname: window.location.pathname }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
  // #endregion
  try {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.jsx:25', message: 'ERROR in App render', data: { error: error.message, stack: error.stack }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
    // #endregion
    console.error('App render error:', error);
    return <div>Error: {error.message}</div>;
  }
}

export default App
