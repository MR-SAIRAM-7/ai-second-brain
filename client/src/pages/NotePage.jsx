import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '../components/Editor';
import useNoteStore from '../store/useNoteStore';

const NotePage = () => {
    const { id } = useParams();
    const { notes, selectNote, fetchNotes } = useNoteStore();

    // Find the note from the store
    const note = useMemo(() => notes.find(n => n._id === id), [notes, id]);

    useEffect(() => {
        if (!note && notes.length === 0) {
            // If store is empty, maybe we reloaded page. Fetch notes.
            // Note: Sidebar also fetches, but we might race or be standalone.
            // fetchNotes() is idempotent-ish usually.
            fetchNotes();
        } else if (note) {
            selectNote(note);
        }
    }, [id, note, notes.length, fetchNotes, selectNote]);

    if (!note) {
        return <div className="text-gray-500">Loading note or note not found...</div>;
    }

    return <Editor key={note._id} note={note} />;
};

export default NotePage;
