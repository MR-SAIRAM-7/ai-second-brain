import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] animate-in slide-in-from-right fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600' :
                                toast.type === 'success' ? 'bg-green-600' :
                                    'bg-blue-600'
                            }`}
                    >
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="hover:opacity-75">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
