import { useState } from 'react';
import api from '../api/axios'; // Centralized api
import { useToast } from '../context/ToastContext';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering
                ? { username: 'NewUser', email, password }
                : { email, password };

            const res = await api.post(endpoint, payload);

            if (isRegistering) {
                addToast('Registered! Now login.', 'success');
                setIsRegistering(false);
            } else {
                onLogin(res.data.token);
                addToast('Logged in successfully', 'success');
            }
        } catch (err) {
            addToast((isRegistering ? 'Registration' : 'Login') + ' failed: ' + (err.response?.data?.msg || err.message), 'error');
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-lg w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">{isRegistering ? 'Register' : 'Login'}</h2>
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
                <div className="flex gap-2 flex-col">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold">
                        {isRegistering ? 'Register' : 'Login'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
