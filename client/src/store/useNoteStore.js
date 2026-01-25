import { create } from 'zustand';
import api from '../api/axios'; // Use centralized api

const useNoteStore = create((set, get) => ({
    notes: [],
    selectedNote: null,
    loading: false,
    error: null,

    fetchNotes: async () => {
        set({ loading: true, error: null });
        try {
            // Interceptor handles token
            const res = await api.get('/notes');
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
            const res = await api.post('/notes', {});
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
        try {
            const res = await api.put(`/notes/${id}`, updates);

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
