import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BookingService, BookingVM } from '../../../core/services/Booking/booking.service';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.css']
})
export class BookingDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);

  booking?: BookingVM;
  loading = true;
  error = '';

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    console.log('BookingDetails - Route param id:', bookingId);
    if (bookingId) {
      this.loadBooking(+bookingId);
    } else {
      this.error = 'Booking ID not provided';
      this.loading = false;
    }
  }

  loadBooking(id: number): void {
    console.log('Loading booking with id:', id);
    this.loading = true;
    this.error = '';
    this.bookingService.getBookingById(id).subscribe({
      next: (booking) => {
        console.log('Booking loaded successfully:', booking);
        this.booking = booking;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading booking:', err);
        this.error = err.error?.errorMessage || 'Failed to load booking details';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'payment-paid';
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      default:
        return 'payment-default';
    }
  }

  calculateNights(): number {
    if (!this.booking) return 0;
    const checkIn = new Date(this.booking.checkInDate);
    const checkOut = new Date(this.booking.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  goBack(): void {
    this.router.navigate(['/booking/my-bookings']);
  }

  printBooking(): void {
    window.print();
  }
}
