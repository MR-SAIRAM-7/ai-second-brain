import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
    persist(
        (set) => ({
            isChatOpen: false,
            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
            setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

            chatMessages: [],
            addMessage: (msg) => set((state) => ({
                chatMessages: [...state.chatMessages, msg].slice(-50) // Keep last 50
            })),
            clearMessages: () => set({ chatMessages: [] }),
        }),
        {
            name: 'ui-storage', // unique name in localStorage
            partialize: (state) => ({
                isChatOpen: state.isChatOpen,
                chatMessages: state.chatMessages
            }), // Only persist these fields
        }
    )
);

export default useUIStore;
