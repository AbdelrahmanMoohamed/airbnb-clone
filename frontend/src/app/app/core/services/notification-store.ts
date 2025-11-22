// src/app/core/services/notification-store.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { NotificationDto } from '../models/notification';
import { NotificationHub } from './notification-hub';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private apiBase = 'http://localhost:5235/api/notification';

  constructor(
    private http: HttpClient,
    private hub: NotificationHub
  ) {
    // كل ما يجي notification من الـ hub نحدّث الستيت محليًا
    this.hub.notificationReceived.subscribe(n => this.prependNotification(n));
  }

  // initial load
  loadInitial() {
  this.http.get<{ result: NotificationDto[] }>(`${this.apiBase}/user`)
    .pipe(
      map(res => Array.isArray(res.result) ? res.result : []),
      tap((list: NotificationDto[]) => {
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(list.filter((x: NotificationDto) => !x.isRead).length);
      })
    )
    .subscribe({
      next: (list: NotificationDto[]) => console.log('notifications loaded', list),
      error: err => console.error('Failed to load notifications', err)
    });
}

  private prependNotification(n: NotificationDto) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([n, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + (n.isRead ? 0 : 1));
  }

  markAsRead(id: number) {
    return this.http.put(`${this.apiBase}/${id}/read`, {}).pipe(
      tap(() => {
        const list = this.notificationsSubject.value.map(x => x.id === id ? { ...x, isRead: true } : x);
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(list.filter(x => !x.isRead).length);
      })
    );
  }

  markAllAsRead() {
    return this.http.put(`${this.apiBase}/read-all`, {}).pipe(
      tap(() => {
        const list = this.notificationsSubject.value.map(x => ({ ...x, isRead: true }));
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(0);
      })
    );
  }
}
