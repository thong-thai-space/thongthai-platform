import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [rawName, ...rest] = pair.trim().split('=');
    if (rawName === key) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const tokenFromAuth = client.handshake.auth.token as string | undefined;
      const tokenFromCookie = getCookieValue(client.handshake.headers.cookie, 'accessToken');
      const token = tokenFromCookie || tokenFromAuth;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });
      this.connectedUsers.set(payload.sub, client.id);
      void client.join(`user:${payload.sub}`);
      this.logger.log(`User ${payload.sub} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToTeam(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
