"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationAsRead = exports.sendNotification = exports.closeSocket = exports.getSocket = exports.initializeSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let socket = null;
const initializeSocket = (userId) => {
    if (!socket) {
        // Inicializar la conexión
        socket = (0, socket_io_client_1.io)(process.env.NEXTAUTH_URL || 'http://localhost:3001', {
            withCredentials: true,
        });
        // Manejar la conexión
        socket.on('connect', () => {
            console.log('Conectado al servidor de WebSockets');
            // Autenticar al usuario
            socket.emit('authenticate', userId);
        });
        // Manejar la desconexión
        socket.on('disconnect', () => {
            console.log('Desconectado del servidor de WebSockets');
        });
        // Manejar errores
        socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
        });
    }
    return socket;
};
exports.initializeSocket = initializeSocket;
const getSocket = () => {
    return socket;
};
exports.getSocket = getSocket;
const closeSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
exports.closeSocket = closeSocket;
// Función para enviar una notificación
const sendNotification = (type, content, fromUserId, toUserId) => {
    if (socket) {
        socket.emit('notification:create', {
            type,
            content,
            fromUserId,
            toUserId
        });
    }
};
exports.sendNotification = sendNotification;
// Función para marcar una notificación como leída
const markNotificationAsRead = (notificationId) => {
    if (socket) {
        socket.emit('notification:markAsRead', notificationId);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
