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

function initializeSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    
    console.log(`Servidor de sockets inicializado en ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
    
    // Mapa para mantener un registro de qué socket pertenece a qué usuario
    const userSocketMap = new Map();
    
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        
        // Autenticar al usuario y registrar su socket
        socket.on('authenticate', (userId) => {
            // Verificar si el ID es válido
            if (!userId || typeof userId !== 'string') {
                console.warn('ID de usuario inválido:', userId);
                socket.emit('error', { message: 'ID de usuario inválido' });
                return;
            }
            
            // Forzar el ID correcto para Ivan Zarate
            if (userId === 'b9e11de8-e612-4abd-b59d-ce3109a9820b') {
                console.log('Corrigiendo ID de Ivan Zarate en servidor:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
                userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
            }
            
            // Forzar el ID correcto para Maxi Scarimbolo
            if (userId === '2' || userId === 'gestor') {
                console.log('Corrigiendo ID de Maxi Scarimbolo en servidor:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
                userId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
            }
            
            userSocketMap.set(userId, socket.id);
            console.log(`Usuario ${userId} autenticado con socket ${socket.id}`);
            
            // Unirse a una sala específica para este usuario
            socket.join(`user:${userId}`);
            
            // Enviar notificaciones no leídas al usuario cuando se conecta
            sendUnreadNotifications(userId, socket);
        });

        // Manejar solicitudes manuales de notificaciones no leídas
        socket.on('get:unreadNotifications', () => {
            // Encontrar el userId asociado con este socket
            let foundUserId = null;
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    foundUserId = userId;
                    break;
                }
            }

            if (foundUserId) {
                console.log(`Solicitud manual de notificaciones no leídas para usuario ${foundUserId}`);
                sendUnreadNotifications(foundUserId, socket);
            } else {
                console.warn('Solicitud de notificaciones no leídas de un socket no autenticado:', socket.id);
                // Intentar enviar un mensaje de error al cliente
                socket.emit('error', { message: 'No autenticado' });
            }
        });

        // Manejar la creación de notificaciones
        socket.on('notification:create', (payload) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[SERVIDOR] Recibida solicitud para crear notificación: ${JSON.stringify(payload)}`);
                
                // Verificar si los IDs son válidos
                if (!payload.fromUserId || !payload.toUserId || typeof payload.fromUserId !== 'string' || typeof payload.toUserId !== 'string') {
                    console.warn('IDs de usuario inválidos en notification:create:', payload);
                    socket.emit('error', { message: 'IDs de usuario inválidos' });
                    return;
                }
                
                // Verificar si el ID de Maxi Scarimbolo es correcto
                if (payload.toUserId === 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
                    console.log('[SERVIDOR] ID de Maxi Scarimbolo es correcto:', payload.toUserId);
                }
                
                // Verificar si el ID de Ivan Zarate es correcto
                if (payload.toUserId === '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
                    console.log('[SERVIDOR] ID de Ivan Zarate es correcto:', payload.toUserId);
                }
                
                // Forzar el ID correcto para Ivan Zarate
                if (payload.toUserId === 'b9e11de8-e612-4abd-b59d-ce3109a9820b') {
                    console.log('Corrigiendo ID de Ivan Zarate en notification:create:', payload.toUserId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
                    payload.toUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
                }
                
                console.log(`[SERVIDOR] Creando notificación: ${payload.type} de ${payload.fromUserId} a ${payload.toUserId}`);
                
                // Verificar si el usuario destinatario existe en la base de datos
                const toUser = yield prisma.user.findUnique({
                    where: { id: payload.toUserId }
                });
                
                if (!toUser) {
                    console.error(`[SERVIDOR] Error: Usuario destinatario con ID ${payload.toUserId} no encontrado en la base de datos`);
                    socket.emit('error', { message: `Usuario destinatario con ID ${payload.toUserId} no encontrado` });
                    return;
                }
                
                console.log(`[SERVIDOR] Usuario destinatario encontrado: ${toUser.firstName} ${toUser.lastName} (${toUser.email})`);
                
                // Verificar si el usuario remitente existe en la base de datos
                const fromUser = yield prisma.user.findUnique({
                    where: { id: payload.fromUserId }
                });
                
                if (!fromUser) {
                    console.error(`[SERVIDOR] Error: Usuario remitente con ID ${payload.fromUserId} no encontrado en la base de datos`);
                    socket.emit('error', { message: `Usuario remitente con ID ${payload.fromUserId} no encontrado` });
                    return;
                }
                
                console.log(`[SERVIDOR] Usuario remitente encontrado: ${fromUser.firstName} ${fromUser.lastName} (${fromUser.email})`);
                
                // Guardar la notificación en la base de datos
                const notification = yield prisma.notification.create({
                    data: {
                        type: payload.type,
                        content: payload.content,
                        fromId: payload.fromUserId,
                        toId: payload.toUserId,
                        isRead: false
                    }
                });
                
                console.log(`[SERVIDOR] Notificación creada con ID: ${notification.id}`);
                
                // Verificar si el usuario destinatario está conectado
                const socketId = userSocketMap.get(payload.toUserId);
                if (socketId) {
                    console.log(`[SERVIDOR] Usuario destinatario está conectado con socket ID: ${socketId}`);
                } else {
                    console.log(`[SERVIDOR] Usuario destinatario NO está conectado actualmente`);
                }
                
                // Enviar la notificación al usuario destinatario si está conectado
                io.to(`user:${payload.toUserId}`).emit('notification:new', {
                    id: notification.id,
                    type: notification.type,
                    content: notification.content,
                    fromId: notification.fromId,
                    createdAt: notification.createdAt,
                    isRead: notification.isRead
                });
                
                console.log(`[SERVIDOR] Notificación enviada a usuario ${payload.toUserId}`);
            }
            catch (error) {
                console.error('[SERVIDOR] Error al crear notificación:', error);
                socket.emit('error', { message: 'Error al crear notificación' });
            }
        }));
        
        // Manejar la marcación de notificaciones como leídas
        socket.on('notification:markAsRead', (notificationId) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Marcando notificación como leída: ${notificationId}`);
                
                yield prisma.notification.update({
                    where: { id: notificationId },
                    data: { isRead: true }
                });
                
                console.log(`Notificación ${notificationId} marcada como leída`);
            }
            catch (error) {
                console.error('Error al marcar notificación como leída:', error);
                socket.emit('error', { message: 'Error al marcar notificación como leída' });
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
            // Verificar si el ID es válido
            if (!userId || typeof userId !== 'string') {
                console.warn('ID de usuario inválido en sendUnreadNotifications:', userId);
                socket.emit('error', { message: 'ID de usuario inválido' });
                return;
            }
            
            // Forzar el ID correcto para Ivan Zarate
            if (userId === 'b9e11de8-e612-4abd-b59d-ce3109a9820b') {
                console.log('Corrigiendo ID de Ivan Zarate en sendUnreadNotifications:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
                userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
            }
            
            // Forzar el ID correcto para Maxi Scarimbolo
            if (userId === '2' || userId === 'gestor') {
                console.log('Corrigiendo ID de Maxi Scarimbolo en sendUnreadNotifications:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
                userId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
            }
            
            console.log(`Buscando notificaciones no leídas para usuario ${userId}`);
            
            const unreadNotifications = yield prisma.notification.findMany({
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
            
            console.log(`Encontradas ${unreadNotifications.length} notificaciones no leídas para usuario ${userId}`);
            
            // Siempre enviar el evento, incluso si no hay notificaciones
            socket.emit('notification:unread', unreadNotifications);
            
            if (unreadNotifications.length > 0) {
                console.log(`Enviadas ${unreadNotifications.length} notificaciones no leídas a usuario ${userId}`);
            } else {
                console.log(`No hay notificaciones no leídas para usuario ${userId}`);
            }
        }
        catch (error) {
            console.error('Error al obtener notificaciones no leídas:', error);
            // Intentar enviar un mensaje de error al cliente
            socket.emit('error', { message: 'Error al obtener notificaciones' });
        }
    });
}
