import { create } from 'zustand';
import axios from 'axios';

const useNoteStore = create((set, get) => ({
    notes: [],
    selectedNote: null,
    loading: false,
    error: null,

    fetchNotes: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/notes', {
                headers: { 'x-auth-token': token },
            });
            set({ notes: res.data, loading: false });
        } catch (err) {
            set({
                error: err.response?.data?.msg || 'Failed to fetch notes',
                loading: false,
            });
        }
    },

    createNote: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                '/api/notes',
                {},
                {
                    headers: { 'x-auth-token': token },
                }
            );
            set((state) => ({
                notes: [res.data, ...state.notes],
                selectedNote: res.data,
                loading: false,
            }));
            return res.data;
        } catch (err) {
            set({
                error: err.response?.data?.msg || 'Failed to create note',
                loading: false,
            });
        }
    },

    updateNote: async (id, updates) => {
        // Optimistic update could go here, but for now we'll wait for server
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `/api/notes/${id}`,
                updates,
                {
                    headers: { 'x-auth-token': token },
                }
            );

            set((state) => ({
                notes: state.notes.map((n) => (n._id === id ? res.data : n)),
                selectedNote: state.selectedNote && state.selectedNote._id === id ? res.data : state.selectedNote,
            }));
        } catch (err) {
            console.error('Failed to update note:', err);
            set({
                error: err.response?.data?.msg || 'Failed to update note',
            });
        }
    },

    selectNote: (note) => {
        set({ selectedNote: note });
    },
}));

export default useNoteStore;
