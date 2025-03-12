"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketServer = initializeSocketServer;
const socket_io_1 = require("socket.io");
const prisma_1 = require("../lib/prisma");
function initializeSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    // Mapa para mantener un registro de qué socket pertenece a qué usuario
    const userSocketMap = new Map();
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        // Autenticar al usuario y registrar su socket
        socket.on('authenticate', (userId) => {
            userSocketMap.set(userId, socket.id);
            console.log(`Usuario ${userId} autenticado con socket ${socket.id}`);
            // Unirse a una sala específica para este usuario
            socket.join(`user:${userId}`);
            // Enviar notificaciones no leídas al usuario cuando se conecta
            sendUnreadNotifications(userId, socket);
        });
        // Manejar la creación de notificaciones
        socket.on('notification:create', (payload) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Guardar la notificación en la base de datos
                const notification = yield prisma_1.prisma.notification.create({
                    data: {
                        type: payload.type,
                        content: payload.content,
                        fromId: payload.fromUserId,
                        toId: payload.toUserId,
                        isRead: false
                    }
                });
                // Enviar la notificación al usuario destinatario si está conectado
                io.to(`user:${payload.toUserId}`).emit('notification:new', {
                    id: notification.id,
                    type: notification.type,
                    content: notification.content,
                    fromId: notification.fromId,
                    createdAt: notification.createdAt,
                    isRead: notification.isRead
                });
                console.log(`Notificación enviada a usuario ${payload.toUserId}`);
            }
            catch (error) {
                console.error('Error al crear notificación:', error);
            }
        }));
        // Manejar la marcación de notificaciones como leídas
        socket.on('notification:markAsRead', (notificationId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.prisma.notification.update({
                    where: { id: notificationId },
                    data: { isRead: true }
                });
            }
            catch (error) {
                console.error('Error al marcar notificación como leída:', error);
            }
        }));
        // Manejar la desconexión
        socket.on('disconnect', () => {
            // Eliminar el usuario del mapa cuando se desconecta
            // Convertir a array para evitar problemas de compatibilidad
            Array.from(userSocketMap.entries()).forEach(([userId, socketId]) => {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    console.log(`Usuario ${userId} desconectado`);
                }
            });
        });
    });
    return io;
}
// Función para enviar notificaciones no leídas a un usuario
function sendUnreadNotifications(userId, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const unreadNotifications = yield prisma_1.prisma.notification.findMany({
                where: {
                    toId: userId,
                    isRead: false
                },
                include: {
                    from: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            photoUrl: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            if (unreadNotifications.length > 0) {
                socket.emit('notification:unread', unreadNotifications);
            }
        }
        catch (error) {
            console.error('Error al obtener notificaciones no leídas:', error);
        }
    });
}
