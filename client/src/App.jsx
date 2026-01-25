import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
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
        <Route
          path="/login"
          element={!token ? <Login onLogin={setToken} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={token ? <DashboardLayout onLogout={() => setToken(null)} /> : <Navigate to="/login" />}
        >
          <Route index element={<p className="text-gray-500">Select a note to view</p>} />
          <Route path="notes/:id" element={<NotePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
