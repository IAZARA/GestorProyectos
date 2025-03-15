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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();

// Mapeo de usuarios a sockets
const userSockets = new Map();

function initializeSocketServer(httpServer) {
    try {
        console.log('Inicializando servidor de WebSockets...');
        
        // Crear el servidor de Socket.IO
        const io = new socket_io_1.Server(httpServer, {
            path: '/socket.io/',
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['polling', 'websocket'],
            allowEIO3: true
        });
        
        console.log(`Servidor de sockets inicializado en puerto 3000`);
        
        // Manejar conexiones de clientes
        io.on('connection', async (socket) => {
            console.log(`[SOCKET-SERVER] Nueva conexión: ${socket.id}`);
            
            // Obtener el ID de usuario de la autenticación
            const userId = socket.handshake.auth?.userId;
            
            if (!userId) {
                console.log('[SOCKET-SERVER] Conexión sin ID de usuario, desconectando');
                socket.disconnect();
                return;
            }
            
            console.log(`[SOCKET-SERVER] Usuario conectado: ${userId}`);
            
            // Verificar que el usuario existe en la base de datos
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId }
                });
                
                if (!user) {
                    console.log(`[SOCKET-SERVER] Usuario no encontrado en la base de datos: ${userId}`);
                    socket.disconnect();
                    return;
                }
                
                console.log(`[SOCKET-SERVER] Usuario verificado: ${user.firstName} ${user.lastName} (${userId})`);
                
                // Registrar el socket para este usuario
                userSockets.set(userId, socket.id);
                socket.userId = userId;
                
                // Unir al usuario a su sala personal
                socket.join(userId);
                console.log(`[SOCKET-SERVER] Usuario unido a sala: ${userId}`);
                
                // Enviar notificaciones no leídas al usuario
                await sendUnreadNotifications(socket, userId);
                
            } catch (error) {
                console.error('[SOCKET-SERVER] Error al verificar usuario:', error);
                socket.disconnect();
                return;
            }
            
            // Manejar solicitud de notificaciones no leídas
            socket.on('get:unreadNotifications', async () => {
                console.log(`[SOCKET-SERVER] Solicitud de notificaciones no leídas de: ${socket.userId}`);
                await sendUnreadNotifications(socket, socket.userId);
            });
            
            // Manejar creación de notificaciones
            socket.on('notification:send', async (notificationData) => {
                try {
                    console.log('[SOCKET-SERVER] Solicitud para enviar notificación:', notificationData);
                    
                    // Verificar datos mínimos requeridos
                    if (!notificationData.type || !notificationData.content || !notificationData.toUserId) {
                        console.error('[SOCKET-SERVER] Datos de notificación incompletos');
                        return;
                    }
                    
                    // Usar el ID del socket como remitente si no se proporciona
                    const fromUserId = notificationData.fromUserId || socket.userId;
                    const toUserId = notificationData.toUserId;
                    
                    // Verificar que el destinatario existe
                    const toUser = await prisma.user.findUnique({
                        where: { id: toUserId }
                    });
                    
                    if (!toUser) {
                        console.error(`[SOCKET-SERVER] Usuario destinatario no encontrado: ${toUserId}`);
                        return;
                    }
                    
                    // Crear la notificación en la base de datos
                    const notification = await prisma.notification.create({
                        data: {
                            type: notificationData.type,
                            content: notificationData.content,
                            from: { connect: { id: fromUserId } },
                            to: { connect: { id: toUserId } },
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
                        }
                    });
                    
                    console.log(`[SOCKET-SERVER] Notificación creada: ${notification.id} para usuario ${toUserId}`);
                    
                    // Enviar la notificación al destinatario si está conectado
                    const recipientSocketId = userSockets.get(toUserId);
                    if (recipientSocketId) {
                        console.log(`[SOCKET-SERVER] Enviando notificación a socket: ${recipientSocketId}`);
                        io.to(recipientSocketId).emit('notification:new', notification);
                    } else {
                        console.log(`[SOCKET-SERVER] Usuario ${toUserId} no está conectado, la notificación se entregará cuando se conecte`);
                    }
                    
                } catch (error) {
                    console.error('[SOCKET-SERVER] Error al crear notificación:', error);
                }
            });
            
            // Manejar desconexión
            socket.on('disconnect', () => {
                console.log(`[SOCKET-SERVER] Usuario desconectado: ${socket.userId}`);
                if (socket.userId) {
                    userSockets.delete(socket.userId);
                }
            });
        });
        
        return io;
    } catch (error) {
        console.error('Error al inicializar servidor de WebSockets:', error);
        throw error;
    }
}

// Función para enviar notificaciones no leídas a un usuario
async function sendUnreadNotifications(socket, userId) {
    try {
        const unreadNotifications = await prisma.notification.findMany({
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
            socket.emit('notifications:unread', unreadNotifications);
        }
    } catch (error) {
        console.error('[SOCKET-SERVER] Error al obtener notificaciones no leídas:', error);
    }
}
