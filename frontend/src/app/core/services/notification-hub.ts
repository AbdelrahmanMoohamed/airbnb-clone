import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { NotificationDto } from '../models/notification';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationHub {
  private hubConnection!: signalR.HubConnection;
  public notificationReceived = new Subject<NotificationDto>();
  public notificationRead = new Subject<{ notificationId: number; readerId: string }>();
  private isConnecting = false;

  constructor(private auth: AuthService) { }

  public startConnection() {
    // Only start the hub when user is authenticated
    const isAuth = this.auth.isAuthenticated();
    console.log('NotificationHub.startConnection: isAuthenticated=', isAuth);
    if (!isAuth) {
      console.log('NotificationHub: user not authenticated — skipping start');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('NotificationHub: Connection already in progress, skipping...');
      return;
    }

    // Check if already connected
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('NotificationHub: Already connected');
      return;
    }

    this.isConnecting = true;

    const payload = this.auth.getPayload() || {};
    const userID = payload['sub'] || payload['id'] || payload['nameid'] || payload['userId'] || '';
    const token = this.auth.getToken() || '';
    console.log('NotificationHub: starting for userID=', userID, ' tokenPresent=', !!token);

    // if a connection already exists, stop it first
    if (this.hubConnection) {
      try { this.hubConnection.stop(); } catch {}
      this.hubConnection = undefined as any;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5235/notificationsHub?userID=${userID}`, {
        accessTokenFactory: () => this.auth.getToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    // attach handlers before starting
    this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
      console.log('Notification received from hub', notification);
      this.notificationReceived.next(notification);
    });
    this.hubConnection.on('NotificationRead', (payload: any) => {
      console.log('NotificationRead event from hub', payload);
      this.notificationRead.next({ notificationId: payload.notificationId, readerId: String(payload.readerId) });
    });

    // Handle reconnection events
    this.hubConnection.onreconnecting((error) => {
      console.warn('NotificationHub: Connection lost. Reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('NotificationHub: Reconnected successfully. ConnectionId:', connectionId);
    });

    this.hubConnection.onclose((error) => {
      console.error('NotificationHub: Connection closed.', error);
      this.isConnecting = false;
      // Attempt to restart after 5 seconds if connection is closed
      setTimeout(() => {
        console.log('NotificationHub: Attempting to restart connection...');
        this.startConnection();
      }, 5000);
    });

    this.hubConnection.start()
      .then(() => {
        console.log('NotificationHub: SignalR connected');
        this.isConnecting = false;
      })
      .catch(err => {
        console.error('NotificationHub: SignalR connection error:', err);
        this.isConnecting = false;
        setTimeout(() => this.startConnection(), 5000);
      });
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('NotificationHub: Connection stopped'))
        .catch(err => console.error('NotificationHub: Error stopping connection:', err));
    }
  }
}
