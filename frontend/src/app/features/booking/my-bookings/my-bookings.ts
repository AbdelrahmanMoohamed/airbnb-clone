import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/Booking/booking-service';
import { BookingStoreService } from '../../../core/services/Booking/booking-store-service';
import { GetBookingVM, canRetryPayment } from '../../../core/models/booking';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  private bookingService = inject(BookingService);
  private bookingStore = inject(BookingStoreService);
  private router = inject(Router);

  bookings = signal<GetBookingVM[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  processingBookingIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.bookingService.getMyBookings().subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success && response.result) {
          this.bookings.set(response.result);
          this.bookingStore.setMyBookings(response.result);
        } else {
          this.errorMessage.set(response.errorMessage || 'Failed to load bookings');
          Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: response.errorMessage || 'Failed to load bookings',
            confirmButtonColor: '#d00'
          });
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('An error occurred while loading bookings');
        console.error('Bookings loading error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while loading bookings',
          confirmButtonColor: '#d00'
        });
      }
    });
  }

  /**
   * Check if a booking can retry payment
   */
  canRetryPayment(booking: GetBookingVM): boolean {
    return canRetryPayment(booking);
  }

  /**
   * Check if a booking is currently being processed
   */
  isProcessing(bookingId: number): boolean {
    return this.processingBookingIds().has(bookingId);
  }

  /**
   * Continue to payment for a pending/failed booking
   */
  continueToPayment(booking: GetBookingVM): void {
    // Add to processing set
    this.processingBookingIds.update(ids => {
      const newSet = new Set(ids);
      newSet.add(booking.id);
      return newSet;
    });

    // Store the booking in the store for the payment component
    this.bookingStore.setCurrentBooking(booking);
    
    // Store payment intent if available
    if (booking.clientSecret && booking.paymentIntentId) {
      this.bookingStore.setPaymentIntent(
        booking.clientSecret,
        booking.paymentIntentId
      );
    }

    // Show loading message
    Swal.fire({
      title: 'Preparing Payment',
      text: 'Redirecting to payment page...',
      icon: 'info',
      timer: 1500,
      showConfirmButton: false,
      allowOutsideClick: false
    });

    // Navigate to payment page
    setTimeout(() => {
      this.router.navigate(['/booking/payment', booking.id]).then(
        (success) => {
          if (!success) {
            // Navigation failed
            this.processingBookingIds.update(ids => {
              const newSet = new Set(ids);
              newSet.delete(booking.id);
              return newSet;
            });
            
            Swal.fire({
              icon: 'error',
              title: 'Navigation Failed',
              text: 'Could not navigate to payment page. Please try again.',
              confirmButtonColor: '#d00'
            });
          }
        },
        (err) => {
          console.error('Navigation error:', err);
          this.processingBookingIds.update(ids => {
            const newSet = new Set(ids);
            newSet.delete(booking.id);
            return newSet;
          });
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again.',
            confirmButtonColor: '#d00'
          });
        }
      );
    }, 1500);
  }

  cancelBooking(bookingId: number): void {
    Swal.fire({
      title: 'Cancel Booking?',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d00',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: 'Cancelling...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.bookingService.cancelBooking(bookingId).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Cancelled!',
                text: 'Your booking has been cancelled successfully.',
                confirmButtonColor: '#28a745'
              });
              this.loadMyBookings(); // Reload bookings
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Cancellation Failed',
                text: response.errorMessage || 'Failed to cancel booking',
                confirmButtonColor: '#d00'
              });
            }
          },
          error: (error) => {
            console.error('Booking cancellation error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'An error occurred while cancelling booking',
              confirmButtonColor: '#d00'
            });
          }
        });
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-success status-confirmed';
      case 'pending':
        return 'bg-warning status-pending';
      case 'cancelled':
        return 'bg-danger status-cancelled';
      default:
        return 'bg-secondary status-default';
    }
  }

  getPaymentBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'failed':
        return 'bg-danger';
      case 'refunded':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }
}