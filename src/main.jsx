import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Dashboard from './Dashboard.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import AuthGuard from './components/AuthGuard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/voice" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
