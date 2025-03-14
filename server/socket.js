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
        
        console.log(`Servidor de sockets inicializado en ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
        
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
            
            // Verificar y corregir IDs conocidos
            let correctedUserId = userId;
            
            // Corregir ID para Ivan Zarate si es necesario
            if (userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c' && 
                (userId.includes('ivan') || userId.includes('zarate'))) {
                console.log('[SOCKET-SERVER] Corrigiendo ID de Ivan Zarate:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
                correctedUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
            }
            
            // Corregir ID para Maxi Scarimbolo si es necesario
            if (userId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f' && 
                (userId.includes('maxi') || userId.includes('scarimbolo'))) {
                console.log('[SOCKET-SERVER] Corrigiendo ID de Maxi Scarimbolo:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
                correctedUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
            }
            
            // Verificar que el usuario existe en la base de datos
            try {
                const user = await prisma.user.findUnique({
                    where: { id: correctedUserId }
                });
                
                if (!user) {
                    console.log(`[SOCKET-SERVER] Usuario no encontrado en la base de datos: ${correctedUserId}`);
                    // Intentar buscar por nombre o email para diagnóstico
                    const possibleUsers = await prisma.user.findMany({
                        where: {
                            OR: [
                                { firstName: { contains: userId, mode: 'insensitive' } },
                                { lastName: { contains: userId, mode: 'insensitive' } },
                                { email: { contains: userId, mode: 'insensitive' } }
                            ]
                        }
                    });
                    
                    if (possibleUsers.length > 0) {
                        console.log('[SOCKET-SERVER] Posibles coincidencias de usuario:', possibleUsers.map(u => `${u.id} (${u.firstName} ${u.lastName})`));
                    }
                    
                    socket.disconnect();
                    return;
                }
                
                console.log(`[SOCKET-SERVER] Usuario verificado: ${user.firstName} ${user.lastName} (${correctedUserId})`);
                
                // Registrar el socket para este usuario
                userSockets.set(correctedUserId, socket.id);
                socket.userId = correctedUserId;
                
                // Unir al usuario a su sala personal
                socket.join(correctedUserId);
                console.log(`[SOCKET-SERVER] Usuario unido a sala: ${correctedUserId}`);
                
                // Enviar notificaciones no leídas al usuario
                await sendUnreadNotifications(socket, correctedUserId);
                
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
                    
                    // Corregir ID para Ivan Zarate si es necesario
                    let toUserId = notificationData.toUserId;
                    if (toUserId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c' && 
                        (toUserId.includes('ivan') || toUserId.includes('zarate'))) {
                        console.log('[SOCKET-SERVER] Corrigiendo ID de destinatario (Ivan Zarate):', toUserId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
                        toUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
                    }
                    
                    // Corregir ID para Maxi Scarimbolo si es necesario
                    if (toUserId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f' && 
                        (toUserId.includes('maxi') || toUserId.includes('scarimbolo'))) {
                        console.log('[SOCKET-SERVER] Corrigiendo ID de destinatario (Maxi Scarimbolo):', toUserId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
                        toUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
                    }
                    
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
            
            // Manejar marcar notificación como leída
            socket.on('notification:markAsRead', async (notificationId) => {
                try {
                    console.log(`[SOCKET-SERVER] Marcando notificación como leída: ${notificationId}`);
                    
                    // Verificar que la notificación existe
                    const notification = await prisma.notification.findUnique({
                        where: { id: notificationId }
                    });
                    
                    if (!notification) {
                        console.error(`[SOCKET-SERVER] Notificación no encontrada: ${notificationId}`);
                        return;
                    }
                    
                    // Actualizar la notificación
                    await prisma.notification.update({
                        where: { id: notificationId },
                        data: { isRead: true }
                    });
                    
                    console.log(`[SOCKET-SERVER] Notificación marcada como leída: ${notificationId}`);
                    
                } catch (error) {
                    console.error('[SOCKET-SERVER] Error al marcar notificación como leída:', error);
                }
            });
            
            // Manejar desconexión
            socket.on('disconnect', () => {
                console.log(`[SOCKET-SERVER] Usuario desconectado: ${socket.userId}`);
                
                // Eliminar el socket del mapeo
                if (socket.userId) {
                    userSockets.delete(socket.userId);
                }
            });
        });
        
        return io;
    } catch (error) {
        console.error('Error al inicializar el servidor de WebSockets:', error);
        return null;
    }
}

// Función para enviar notificaciones no leídas a un usuario
async function sendUnreadNotifications(socket, userId) {
    try {
        console.log(`[SOCKET-SERVER] Buscando notificaciones no leídas para: ${userId}`);
        
        // Obtener notificaciones no leídas
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
        
        console.log(`[SOCKET-SERVER] Encontradas ${unreadNotifications.length} notificaciones no leídas para: ${userId}`);
        
        // Enviar notificaciones al usuario
        socket.emit('notification:unread', unreadNotifications);
        
    } catch (error) {
        console.error('[SOCKET-SERVER] Error al enviar notificaciones no leídas:', error);
    }
}

// Función para crear una notificación de prueba
async function createTestNotification(fromUserId, toUserId, type, content) {
    try {
        // Verificar que los usuarios existen
        const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
        const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
        
        if (!fromUser || !toUser) {
            console.error('[SOCKET-SERVER] Usuario no encontrado para notificación de prueba');
            return null;
        }
        
        // Crear la notificación
        const notification = await prisma.notification.create({
            data: {
                type,
                content,
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
        
        console.log(`[SOCKET-SERVER] Notificación de prueba creada: ${notification.id}`);
        return notification;
        
    } catch (error) {
        console.error('[SOCKET-SERVER] Error al crear notificación de prueba:', error);
        return null;
    }
}
