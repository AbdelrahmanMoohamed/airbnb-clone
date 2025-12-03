// src/app/core/services/notification-store.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { NotificationDto } from '../models/notification';
import { NotificationHub } from './notification-hub';
import { NotificationService } from './api/notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  // use NotificationService for API calls

  constructor(
    private api: NotificationService,
    private hub: NotificationHub
  ) {
    // When a new notification arrives, add it to the top of the list
    this.hub.notificationReceived.subscribe(n => {
      console.log('NotificationStore: Received notification from hub', n);
      this.prependNotification(n);
    });

    // When a notification is read, update its state in the list
    this.hub.notificationRead.subscribe(payload => {
      console.log('NotificationStore: Received read confirmation from hub', payload);
      const notifications = this.notificationsSubject.value;
      const index = notifications.findIndex(n => n.id === payload.notificationId);
      if (index > -1 && !notifications[index].isRead) {
        notifications[index] = { ...notifications[index], isRead: true };
        this.notificationsSubject.next([...notifications]);
        this.unreadCountSubject.next(this.unreadCountSubject.value - 1);
      }
    });
  }

  // Load unread notifications for navbar dropdown
  loadUnread() {
    this.api.getUnread()
      .pipe(
        map((res: any) => Array.isArray(res.result) ? res.result : []),
        tap((list: NotificationDto[]) => {
          this.notificationsSubject.next(list);
          console.log('Unread notifications loaded:', list.length);
        })
      )
      .subscribe({
        next: () => this.loadUnreadCount(),
        error: err => console.error('Failed to load unread notifications', err)
      });
  }

  // Load unread count from server
  loadUnreadCount() {
    this.api.getUnreadCount()
      .pipe(
        map((res: any) => res.result ?? 0)
      )
      .subscribe({
        next: (count: number) => {
          this.unreadCountSubject.next(count);
          console.log('Unread count from server:', count);
        },
        error: err => console.error('Failed to load unread count', err)
      });
  }

  // Load all notifications for notification window page
  loadAll() {
    this.api.getForCurrentUser()
      .pipe(
        map((res: any) => Array.isArray(res.result) ? res.result : []),
        tap((list: NotificationDto[]) => {
          this.notificationsSubject.next(list);
          this.unreadCountSubject.next(list.filter((x: NotificationDto) => !x.isRead).length);
          console.log('All notifications loaded:', list.length);
        })
      )
      .subscribe({
        next: (list: NotificationDto[]) => console.log('All notifications:', list),
        error: err => console.error('Failed to load all notifications', err)
      });
  }

  // Backward compatibility - loads unread by default
  loadInitial() {
    this.loadUnread();
    this.loadUnreadCount();
  }

  private prependNotification(n: NotificationDto) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([n, ...current]);
    const newUnreadCount = this.unreadCountSubject.value + (n.isRead ? 0 : 1);
    this.unreadCountSubject.next(newUnreadCount);
    console.log('NotificationStore: Prepended notification. New unread count:', newUnreadCount);
  }

  markAsRead(id: number) {
    // Update local state immediately
    const notifications = this.notificationsSubject.value.slice();
    let changed = false;
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].id === id && !notifications[i].isRead) {
        notifications[i] = { ...notifications[i], isRead: true };
        changed = true;
        break;
      }
    }
    if (changed) {
      this.notificationsSubject.next(notifications);
    }

    // Call backend API to mark as read and reload count
    if (id > 0) {
      this.api.markAsRead(id).subscribe({
        next: () => {
          console.log('Notification marked as read on backend:', id);
          this.loadUnreadCount(); // Reload count from server
        },
        error: (err) => console.error('Failed to mark notification as read on backend:', err)
      });
    }
  }

  markAllAsRead() {
    // Update local state immediately
    const notifications = this.notificationsSubject.value.slice();
    let changed = false;
    for (let i = 0; i < notifications.length; i++) {
      if (!notifications[i].isRead) {
        notifications[i] = { ...notifications[i], isRead: true };
        changed = true;
      }
    }
    if (changed) {
      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(0); // Immediate UI update
    }

    // Call backend API to mark all as read
    this.api.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read on backend');
        this.loadUnreadCount(); // Reload count to confirm
      },
      error: (err) => console.error('Failed to mark all notifications as read on backend:', err)
    });
  }
}
