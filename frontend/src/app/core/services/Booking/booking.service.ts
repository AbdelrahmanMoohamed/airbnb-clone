import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface BookingVM {
  id: number;
  listingId: number;
  listingTitle: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  result: T;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/booking`;

  getMyBookings(): Observable<BookingVM[]> {
    return this.http.get<ApiResponse<BookingVM[]>>(`${this.apiUrl}/me`).pipe(
      map(response => response.result || [])
    );
  }

  getBookingById(id: number): Observable<BookingVM> {
    return this.http.get<ApiResponse<BookingVM>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.result)
    );
  }
}
