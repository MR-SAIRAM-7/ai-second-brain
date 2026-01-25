import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ChatSidebar from './components/ChatSidebar';
import axios from 'axios';
import useNoteStore from './store/useNoteStore';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { selectedNote } = useNoteStore();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post('/api/auth/register', { username: 'NewUser', email, password });
      alert('Registered! Now login.');
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded-lg shadow-lg w-96 space-y-4">
          <h2 className="text-2xl font-bold text-center">Login / Register</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold">Login</button>
            <button type="button" onClick={handleRegister} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold">Register</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar onLogout={() => setToken(null)} />
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 overflow-hidden relative">
        {selectedNote ? (
          <Editor key={selectedNote._id} note={selectedNote} />
        ) : (
          <p className="text-gray-500">Select a note to view</p>
        )}
      </div>
      <ChatSidebar />
    </div>
  );
}

export default App;
