import { create } from 'zustand';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const useStore = create((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('lumina_token'),
    token: localStorage.getItem('lumina_token') || null,
    authLoading: true,

    login: (token) => {
        localStorage.setItem('lumina_token', token);
        set({ token, isAuthenticated: true });
    },

    setUser: (user) => {
        set({ user });
    },

    setAuthLoading: (loading) => {
        set({ authLoading: loading });
    },

    logout: async () => {
        localStorage.removeItem('lumina_token');
        try {
            await signOut(auth);
        } catch (e) {
            // Firebase signOut may fail if no session — safe to ignore
        }
        set({ user: null, isAuthenticated: false, token: null, authLoading: false });
    },

    // UI States
    isDarkMode: localStorage.getItem('theme') === 'dark' || false,
    toggleTheme: () => set((state) => {
        const newVal = !state.isDarkMode;
        if (newVal) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        return { isDarkMode: newVal };
    }),
}));

export default useStore;
