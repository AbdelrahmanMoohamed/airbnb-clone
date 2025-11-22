import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { NotificationDto } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationHub {
  private hubConnection!: signalR.HubConnection;
  public notificationReceived = new Subject<NotificationDto>();

  constructor() {
    this.startConnection();
  }

  public startConnection() {
  const userID = '70188af8-4575-49d8-5822-08de25168bf9'; // replace with real user ID later
  this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:5235/notificationsHub?userID=${userID}`)
    .withAutomaticReconnect()
    .build();

  this.hubConnection.start()
    .then(() => console.log('SignalR connected'))
    .catch(err => {
      console.error('SignalR connection error:', err);
      setTimeout(() => this.startConnection(), 5000);
    });

  this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
    console.log('Notification received from hub', notification);
    this.notificationReceived.next(notification);
  });
}
}
