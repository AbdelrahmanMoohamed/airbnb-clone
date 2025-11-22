import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationDto } from '../../../core/models/notification';
import { NotificationStoreService } from '../../../core/services/notification-store';
import { CommonModule, DatePipe } from '@angular/common';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  unreadCount = 0;
  private sub = new Subscription();
  private prevNotificationsLength = 0;
  public newIds = new Set<number>();

  dropdownOpen = false;

  constructor(private store: NotificationStoreService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub.add(this.store.notifications$.subscribe(list => {
      // detect newly arrived notifications (avoid treating initial load as new)
      if (this.prevNotificationsLength === 0) {
        // initial load
        this.notifications = list;
        this.prevNotificationsLength = list.length;
      } else if (list.length > this.prevNotificationsLength) {
        // new notifications appended at the beginning by prependNotification
        const added = list.slice(0, list.length - this.prevNotificationsLength);
        // collect ids of newly added notifications
        for (const n of added) {
          this.newIds.add(n.id);
          // remove highlight after 6s
          setTimeout(() => { this.newIds.delete(n.id); this.cdr.detectChanges(); }, 6000);
        }
        this.notifications = list;
        this.prevNotificationsLength = list.length;
        // auto-open dropdown briefly to show incoming items
        this.dropdownOpen = true;
        // auto-close after 6s if user didn't interact
        setTimeout(() => { this.dropdownOpen = false; this.cdr.detectChanges(); }, 6000);
      } else {
        this.notifications = list;
        this.prevNotificationsLength = list.length;
      }

      // in zoneless mode we need to trigger change detection manually
      this.cdr.detectChanges();
    }));

    this.sub.add(this.store.unreadCount$.subscribe(cnt => {
      this.unreadCount = cnt;
      this.cdr.detectChanges();
    }));
  }

  openDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  markAll() { this.store.markAllAsRead().subscribe(); }

  markAsRead(id: number, event?: Event) {
    event?.stopPropagation();
    // if user marks it as read, remove from newIds immediately
    this.newIds.delete(id);
    this.store.markAsRead(id).subscribe();
  }

  trackById(_index: number, item: NotificationDto) { return item.id; }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
