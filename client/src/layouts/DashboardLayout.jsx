import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';
import useNoteStore from '../store/useNoteStore';
import { useToast } from '../hooks/useToast';

const DashboardLayout = ({ onLogout }) => {
    const error = useNoteStore((state) => state.error);
    const clearError = useNoteStore((state) => state.clearError);
    const { addToast } = useToast();

    useEffect(() => {
        if (error) {
            addToast(error, 'error');
            clearError();
        }
    }, [error, addToast, clearError]);

    return (
        <div className="flex h-screen bg-black text-white">
            <Sidebar onLogout={onLogout} />
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 overflow-hidden relative">
                <Outlet />
            </div>
            <ChatSidebar />
        </div>
    );
};

export default DashboardLayout;
