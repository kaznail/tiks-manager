import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsGateway {
    private readonly prisma;
    server: Server;
    constructor(prisma: PrismaService);
    private activeUsers;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    sendNotificationToUser(userId: string, payload: any): void;
}
