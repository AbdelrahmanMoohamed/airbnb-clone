import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/Booking/booking-service';
import { ListingService } from '../../../core/services/listings/listing.service';
import { PaymentService } from '../../../core/services/payment/payment-service';
import { CreateBookingVM } from '../../../core/models/booking';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingStoreService } from '../../../core/services/Booking/booking-store-service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, map, of, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-create-booking',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-booking.html',
  styleUrl: './create-booking.css',
})
export class CreateBooking implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private listingService = inject(ListingService);
  private authService = inject(AuthService);
  private bookingStore = inject(BookingStoreService);
  private fb = inject(FormBuilder);
  bookingForm!: FormGroup;
  // listingId!: number;
  isLoading = false;
  errorMessage = '';
  today!: string;
  @Input() listingId!: number;
  @Input() listingPrice: number = 100;
  @Input() listingMaxGuests?: number;
  @Output() bookingCreated = new EventEmitter<any>();
  @Output() bookingCancelled = new EventEmitter<void>();
  ngOnInit(): void {
    if (!this.listingId) {
      this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    }
    this.today = new Date().toISOString().split('T')[0];
    // (removed dev debugging of token payload) 

    // If the parent did not pass prices / maxGuests (route-based), fetch listing details first
    if (!this.listingPrice || !this.listingMaxGuests) {
      if (this.listingId) {
        this.listingService.getById(this.listingId).subscribe((res) => {
          if (!res.isError && res.data) {
            this.listingPrice = res.data.pricePerNight ?? this.listingPrice;
            this.listingMaxGuests = res.data.maxGuests ?? this.listingMaxGuests;
          }
          this.initForm();
        }, (err) => {
          // still init form with defaults
          console.warn('Failed to load listing details for booking', err);
          this.initForm();
        });
      } else {
        this.initForm();
      }
    } else {
      this.initForm();
    }
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    this.bookingForm = this.fb.group({
      checkInDate: [today, [Validators.required]],
      checkOutDate: [tomorrow, [Validators.required]],
      guests: [1, [Validators.required, Validators.min(1), Validators.max(this.listingMaxGuests ?? 10)]],
      paymentMethod: ['stripe', [Validators.required]]
    });

    // cross-field validation: checkOut must be after checkIn
    this.bookingForm.setValidators(() => {
      const checkIn = new Date(this.bookingForm.get('checkInDate')?.value);
      const checkOut = new Date(this.bookingForm.get('checkOutDate')?.value);
      if (checkOut <= checkIn) return { invalidDates: true };
      return null;
    });
  }
  calculateTotalPrice(): number {
    const checkIn = new Date(this.bookingForm.get('checkInDate')?.value);
    const checkOut = new Date(this.bookingForm.get('checkOutDate')?.value);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * (this.listingPrice || 0);
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const bookingData: CreateBookingVM = {
        listingId: this.listingId,
        ...this.bookingForm.value
      };

      // Create booking then create stripe intent (if stripe) atomically on the front-end flow. Use BookingStore to keep the clientSecret.
      this.bookingService.createBooking(bookingData).pipe(
        switchMap((res) => {
          if (!res.success || !res.result) return throwError(() => ({ message: res.errorMessage || 'Failed to create booking' }));
          const created = res.result;
          this.bookingStore.setCurrentBooking(created);
          this.bookingCreated.emit(created);

          // If Stripe payment method -> create intent
          if ((this.bookingForm.get('paymentMethod')?.value || 'stripe').toLowerCase() === 'stripe') {
            const intentPayload = { bookingId: created.id, amount: (created as any).totalPrice ?? (created as any).TotalPrice ?? 0, currency: 'usd' };
            // If createStripeIntent fails (e.g. server 400), catch and return a null intentResp so flow continues
            return this.paymentService.createStripeIntent(intentPayload).pipe(
              // return the actual response object or a fallback object on error so outer flow continues
              map(intentResp => ({ booking: created, intentResp })),
              catchError((err) => {
                console.warn('[CreateBooking] createStripeIntent failed, continuing without clientSecret', err);
                // Return a shape compatible with success flow but with intentResp = null
                return of({ booking: created, intentResp: null });
              })
            );
          }
          return of({ booking: created, intentResp: null });
        }),
        catchError((err) => {
          console.error('Booking+Intent flow error:', err);
          return throwError(() => err);
        })
      ).subscribe({
        next: ({ booking, intentResp }: any) => {
          this.isLoading = false;
          if (intentResp && intentResp.success && intentResp.result) {
            // keep secret in store rather than URL
            const result = intentResp.result;
            this.bookingStore.setPaymentIntent(result.clientSecret, result.paymentIntentId);
            this.router.navigate(['/booking/payment', booking.id]);
          } else {
            // fallback: no clientSecret available
            // ensure we pass a real numeric amount (support multiple casing shapes from backend)
            const fallbackAmount = (booking as any).totalPrice ?? (booking as any).TotalPrice ?? 0;
            this.router.navigate(['/booking/payment', booking.id], { queryParams: { amount: fallbackAmount } });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Create booking error:', error);
          let extracted = '';
          if (error && error.error) {
            const body = error.error;
            if (typeof body === 'string') {
              extracted = body;
            } else if (body.errors && typeof body.errors === 'object') {
              const parts: string[] = [];
              for (const k of Object.keys(body.errors)) {
                const arr = body.errors[k];
                if (Array.isArray(arr)) parts.push(`${k}: ${arr.join('; ')}`);
              }
              extracted = parts.join(' | ');
            } else if (body.title || body.detail) {
              extracted = `${body.title || ''} ${body.detail || ''}`.trim();
            } else if (body.message) {
              extracted = body.message;
            } else {
              try { extracted = JSON.stringify(body); } catch { extracted = String(body); }
            }
          }

          this.errorMessage = extracted || error?.message || 'An error occurred while creating booking';
        }
      });
    }
  }
  onCancel(): void {
    this.bookingCancelled.emit();
  }
  getNumberOfNights(): number {
    const checkIn = new Date(this.bookingForm.get('checkInDate')?.value);
    const checkOut = new Date(this.bookingForm.get('checkOutDate')?.value);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }
  get minCheckOutDate(): string {
    const checkInDate = this.bookingForm.get('checkInDate')?.value;
    if (checkInDate) {
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    }
    return '';
  }
}