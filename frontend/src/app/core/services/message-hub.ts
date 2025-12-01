import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { MessageDto } from '../models/message';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MessageHub {
  private hubConnection!: signalR.HubConnection;
  public messageReceived = new Subject<MessageDto>();
  public messageRead = new Subject<{ messageId: number; readerId: string }>();
  private isConnecting = false;

  constructor(private auth: AuthService) { }

  public startConnection() {
    const isAuth = this.auth.isAuthenticated();
    console.log('MessageHub.startConnection: isAuthenticated=', isAuth);
    if (!isAuth) {
      console.log('MessageHub: user not authenticated — skipping start');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('MessageHub: Connection already in progress, skipping...');
      return;
    }

    // Check if already connected
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('MessageHub: Already connected');
      return;
    }

    this.isConnecting = true;

    const payload = this.auth.getPayload() || {};
    const userID = payload['sub'] || payload['id'] || payload['nameid'] || payload['userId'] || '';
    const token = this.auth.getToken() || '';
    console.log('MessageHub: starting for userID=', userID, ' tokenPresent=', !!token);

    if (this.hubConnection) {
      try { this.hubConnection.stop(); } catch {}
      this.hubConnection = undefined as any;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5235/messagesHub?userID=${userID}`, {
        accessTokenFactory: () => this.auth.getToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      console.log('Message received from hub', message);
      this.messageReceived.next(message);
    });
    this.hubConnection.on('MessageRead', (payload: any) => {
      console.log('MessageRead event from hub', payload);
      this.messageRead.next({ messageId: payload.messageId, readerId: String(payload.readerId) });
    });

    // Handle reconnection events
    this.hubConnection.onreconnecting((error) => {
      console.warn('MessageHub: Connection lost. Reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('MessageHub: Reconnected successfully. ConnectionId:', connectionId);
    });

    this.hubConnection.onclose((error) => {
      console.error('MessageHub: Connection closed.', error);
      this.isConnecting = false;
      setTimeout(() => {
        console.log('MessageHub: Attempting to restart connection...');
        this.startConnection();
      }, 5000);
    });

    this.hubConnection.start()
      .then(() => {
        console.log('MessageHub connected');
        this.isConnecting = false;
      })
      .catch(err => {
        console.error('MessageHub connection error:', err);
        this.isConnecting = false;
        setTimeout(() => this.startConnection(), 5000);
      });
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('MessageHub: Connection stopped'))
        .catch(err => console.error('MessageHub: Error stopping connection:', err));
    }
  }
}
