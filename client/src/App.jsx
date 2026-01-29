import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './layouts/DashboardLayout';
import NotePage from './pages/NotePage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={!token ? <Login onLogin={setToken} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/signup"
          element={!token ? <Signup /> : <Navigate to="/dashboard" />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={token ? <DashboardLayout onLogout={() => setToken(null)} /> : <Navigate to="/login" />}
        >
          <Route index element={<p className="text-gray-500">Select a note to view</p>} />
          <Route path="notes/:id" element={<NotePage />} />
        </Route>

        {/* Catch all - redirect to Landing or Dashboard depending on auth */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
