import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  afterInit() {
    this.logger.log('WebSocket Notifications Gateway initialized');
  }

  emitNewBooking(payload: {
    bookingCode: string;
    guestName: string;
    roomName: string;
    checkIn: string;
  }) {
    this.server.emit('new_booking', { ...payload, at: new Date().toISOString() });
  }
}
