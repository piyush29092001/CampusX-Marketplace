import { io } from 'socket.io-client';

let socket = null;

export const getSocket = (token) => {
    if (!socket && token) {
        socket = io(import.meta.env.VITE_API_URL, { auth: { token } });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
