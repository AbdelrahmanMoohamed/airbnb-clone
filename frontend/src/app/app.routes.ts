import { Routes } from '@angular/router';
import { Home } from './app/features/home-page/home/home';
import { ListingsList } from './app/features/listings/list/listing-list';
import { ListingsCreateEdit } from './app/features/listings/create-edit/listings-create-edit';
import { listingExistsGuard } from './app/features/listings/services/listing-exists.guard';
import { ListingsDetail } from './app/features/listings/detail/listings-detail';


export const routes: Routes = [
  { path: 'home', component: Home },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  // { path: '**', redirectTo: 'home' },
  {
    path: 'listings',
    children: [
      { path: '', component: ListingsList },
      { path: 'create', component: ListingsCreateEdit },
      { path: 'edit/:id', component: ListingsCreateEdit, canActivate: [listingExistsGuard] },
      { path: 'detail/:id', component: ListingsDetail, canActivate: [listingExistsGuard] },
    ],
  }
];
