import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from "./app/shared/components/footer/footer";
import { Navbar } from "./app/shared/components/navbar/navbar";
import { NotificationHub } from './app/core/services/notification-hub';
import { NotificationStoreService } from './app/core/services/notification-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
   protected readonly title = signal('frontend');
   constructor(private hub: NotificationHub, private store: NotificationStoreService) {}

ngOnInit() {
  this.hub.startConnection ();
  this.store.loadInitial(); // load existing notifications once
}

}
