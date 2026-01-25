import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';

const DashboardLayout = ({ onLogout }) => {
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
