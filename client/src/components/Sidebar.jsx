import { useEffect } from 'react';
import useNoteStore from '../store/useNoteStore';
import { Plus, FileText } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
    const { notes, fetchNotes, createNote, selectedNote, selectNote, loading } = useNoteStore();

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return (
        <div className="w-64 bg-gray-900 h-screen flex flex-col border-r border-gray-800 text-gray-300">
            <div className="p-4 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white mb-4">Second Brain</h1>
                <button
                    onClick={createNote}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                    disabled={loading}
                >
                    <Plus size={18} />
                    <span>New Note</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notes.map((note) => (
                    <div
                        key={note._id}
                        onClick={() => selectNote(note)}
                        className={`flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors ${selectedNote?._id === note._id
                            ? 'bg-gray-800 text-white'
                            : 'hover:bg-gray-800/50'
                            }`}
                    >
                        <FileText size={18} className="text-gray-500" />
                        <span className="truncate">{note.title}</span>
                    </div>
                ))}
                {notes.length === 0 && !loading && (
                    <div className='text-center text-sm text-gray-500 mt-10'>No notes found</div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            U
                        </div>
                        <div className="text-sm">User</div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
