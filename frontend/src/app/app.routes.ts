import { Routes } from '@angular/router';
import { Home } from './app/features/home-page/home/home';
import { ListingsList } from './app/features/listings/list/listing-list';
import { ListingsCreateEdit } from './app/features/listings/create-edit/listings-create-edit';
import { listingExistsGuard } from './app/features/listings/services/listing-exists.guard';
import { AuthGuard } from './app/core/guards/auth.guard';
import { ListingsDetail } from './app/features/listings/detail/listings-detail';
import { Login } from './app/features/auth/login';
import { Register } from './app/features/auth/register';
import { Dashboard } from './app/features/admin/dashboard';
import { BookingComponent } from './app/features/booking/booking';
import { PaymentComponent } from './app/features/payment/payment';
import { ChatWindow } from './app/features/message/chat-window';
import { Listings } from './app/features/listings-page/listings/listings';


export const routes: Routes = [
  { path: 'home', component: Home },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'listings', component: Listings},
  // { path: '**', redirectTo: 'home' },
  {
    path: 'host',
    children: [
      { path: '', component: ListingsList },
      { path: 'create', component: ListingsCreateEdit, canActivate: [AuthGuard] },
      { path: 'edit/:id', component: ListingsCreateEdit, canActivate: [listingExistsGuard] },
      { path: 'detail/:id', component: ListingsDetail, canActivate: [listingExistsGuard] },
    ],
  }
  ,
  { path: 'admin', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'booking', component: BookingComponent, canActivate: [AuthGuard] },
  { path: 'payment/:id', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'messages', component: ChatWindow, canActivate: [AuthGuard] },
];
