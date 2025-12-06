// stripe-payment.component.ts - Fixed: Only show success when DB confirms payment
import { Component, inject, OnDestroy, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../core/services/payment/payment-service';
import { BookingStoreService } from '../../../core/services/Booking/booking-store-service';
import { BookingService } from '../../../core/services/Booking/booking-service';
import { CreateStripePaymentVM } from '../../../core/models/payment';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, interval } from 'rxjs';
import { take } from 'rxjs/operators';
import Swal from 'sweetalert2';

declare var Stripe: any;

@Component({
  standalone: true,
  selector: 'app-stripe-payment',
  imports: [CommonModule],
  templateUrl: './stripe-payment.html',
  styleUrl: './stripe-payment.css',
})
export class StripePayment implements OnInit, OnDestroy {
  private stripe: any;
  private elements: any;
  private card: any;
  private stripeScriptLoaded = false;
  private ngZone = inject(NgZone);

  isLoading = new BehaviorSubject<boolean>(false);
  errorMessage = '';
  successMessage = '';
  bookingId!: number;
  amount: number = 0;
  currency: string = 'egp';

  private bookingStore = inject(BookingStoreService);
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  showLoginCTA = false;
  private existingClientSecret?: string | null;
  private existingPaymentIntentId?: string | null;
  intentCreationFailed = false;
  intentCreationInProgress = false;
  bookingLoaded = false;

  private stripePublishableKey = 'pk_test_51QcFrYAIOvv3gPwPsSer0XmyVWEEuWMzHUX6faseM6I99rQOVdqGpklBAtfUdACpZUXYBv4z1sOb1GQSgqv8Ck1200RQCnRXYc';

  ngOnInit(): void {
    this.bookingId = Number(
      this.route.snapshot.paramMap.get('bookingId') ??
      this.route.snapshot.paramMap.get('id')
    );

    if (!this.bookingId || isNaN(this.bookingId)) {
      this.errorMessage = 'Invalid booking ID in route.';
      console.error('Invalid bookingId:', this.bookingId);
      return;
    }

    this.loadBookingData();
    this.loadStripeScript(() => {
      setTimeout(() => {
        this.initializeStripe();
      }, 500);
    });
  }

  ngOnDestroy(): void {
    if (this.card) {
      try {
        this.card.destroy();
      } catch (e) {
        console.warn('Card element already destroyed');
      }
    }
  }

  loginRedirect(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private loadStripeScript(callback: () => void): void {
    if (this.stripeScriptLoaded) {
      callback();
      return;
    }

    if (typeof Stripe !== 'undefined') {
      this.stripeScriptLoaded = true;
      callback();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      this.stripeScriptLoaded = true;
      callback();
    };
    script.onerror = () => {
      console.error('Failed to load Stripe script');
      this.errorMessage = 'Failed to load payment system. Please refresh.';
    };
    document.head.appendChild(script);
  }

  private initializeStripe(): void {
    try {
      if (typeof Stripe === 'undefined') {
        console.error('Stripe not loaded');
        this.errorMessage = 'Payment system not loaded. Please refresh.';
        return;
      }

      const cardElement = document.getElementById('card-element');
      if (!cardElement) {
        console.error('Card element not found in DOM');
        setTimeout(() => {
          this.initializeStripe();
        }, 500);
        return;
      }

      this.stripe = Stripe(this.stripePublishableKey);
      this.elements = this.stripe.elements();

      this.card = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });

      this.card.mount('#card-element');

      this.ngZone.run(() => {
        this.errorMessage = '';
      });

      this.card.on('change', (event: any) => {
        this.ngZone.run(() => {
          if (event.error) {
            this.errorMessage = event.error.message;
          } else {
            this.errorMessage = '';
          }
        });
      });

    } catch (err) {
      this.errorMessage = 'Failed to initialize payment system. ' + (err instanceof Error ? err.message : '');
    }
  }

  private loadBookingData(): void {
    const storedBooking = this.bookingStore.currentBookingSignal?.() ?? null;

    if (storedBooking && storedBooking.id === this.bookingId) {
      this.amount = storedBooking.totalPrice ?? 0;
      this.bookingLoaded = true;

      this.existingClientSecret = this.bookingStore.getPaymentIntentClientSecret();
      this.existingPaymentIntentId = this.bookingStore.getPaymentIntentId();
    } else {
      this.isLoading.next(true);

      this.bookingService.getById(this.bookingId).subscribe({
        next: (resp) => {
          if (resp && resp.success && resp.result) {
            this.bookingStore.setCurrentBooking(resp.result);
            this.amount = resp.result.totalPrice ?? 0;
            this.bookingLoaded = true;

            if (resp.result.clientSecret && resp.result.paymentIntentId) {
              this.existingClientSecret = resp.result.clientSecret;
              this.existingPaymentIntentId = resp.result.paymentIntentId;
              this.bookingStore.setPaymentIntent(
                resp.result.clientSecret,
                resp.result.paymentIntentId
              );
            }
          } else {
            this.errorMessage = resp?.errorMessage || 'Could not load booking.';
          }

          this.isLoading.next(false);
        },
        error: (err) => {
          this.errorMessage = 'Could not load booking details. ' + (err.message ?? '');
          this.isLoading.next(false);
        }
      });
    }
  }

  /**
   */
  private async verifyPaymentInDatabase(maxAttempts: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const booking = await this.bookingService.getById(this.bookingId).toPromise();
        if (booking?.success && booking?.result) {
          const paymentStatus = booking.result.paymentStatus?.toLowerCase();
          const bookingStatus = booking.result.bookingStatus?.toLowerCase();

          // Check if payment is confirmed in DB
          if (paymentStatus === 'paid' && bookingStatus === 'confirmed') {
            return true;
          }
        }
      } catch (error) {
      }
    }
    return false;
  }

  async pay(): Promise<void> {
    // Validation checks
    if (!this.bookingLoaded) {
      this.errorMessage = 'Booking data not loaded. Please wait...';
      return;
    }

    if (!this.amount || this.amount <= 0) {
      this.errorMessage = 'Invalid booking amount. Please refresh and try again.';
      return;
    }

    if (!this.card) {
      this.errorMessage = 'Payment form not ready. Please wait or refresh the page.';
      return;
    }

    if (!this.stripe) {
      this.errorMessage = 'Payment system not initialized. Please refresh the page.';
      return;
    }

    this.isLoading.next(true);
    this.errorMessage = '';

    const doConfirm = async (clientSecret: string) => {
      try {
        console.log('💳 Starting Stripe payment confirmation...');

        const { paymentIntent, error } = await this.stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: this.card }
        });

        if (error) {
          this.ngZone.run(() => {
            this.errorMessage = error.message || 'Payment failed.';
            this.isLoading.next(false);

            Swal.fire({
              icon: 'error',
              title: 'Payment Failed',
              text: error.message || 'Your payment could not be processed. Please try again.',
              confirmButtonColor: '#c62828'
            });
          });
          return;
        }
        if (paymentIntent?.status !== 'succeeded') {
          this.ngZone.run(() => {
            this.errorMessage = 'Payment was not successful. Please try again.';
            this.isLoading.next(false);

            Swal.fire({
              icon: 'warning',
              title: 'Payment Incomplete',
              text: 'Your payment was not completed. Please try again.',
              confirmButtonColor: '#f9a825'
            });
          });
          return;
        }

        console.log('✅ Stripe confirmed payment success');
        this.ngZone.run(() => {
          Swal.fire({
            title: 'Verifying Payment...',
            html: 'Please wait while we confirm your payment in our system.',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
        });

        const isVerified = await this.verifyPaymentInDatabase(3);
        if (!isVerified) {
          this.ngZone.run(() => {
            this.isLoading.next(false);

            Swal.fire({
              icon: 'error',
              title: 'Payment Was Not Verified',
              html: `
        We received your payment information, but your booking was NOT confirmed.<br><br>
        This usually happens when the Stripe webhook is not running.<br><br>
        <strong>Please try again after starting Stripe Webhook or contact support.</strong>
      `,
              confirmButtonColor: '#c62828'
            });
          });

          return;
        }

        this.ngZone.run(() => {
          this.successMessage = 'Payment successful! Redirecting...';
          this.bookingStore.updateBookingStatus(this.bookingId, 'confirmed');
          this.bookingStore.setPaymentIntent(null, null);
          this.isLoading.next(false);

          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your booking has been confirmed.',
            confirmButtonColor: '#28a745',
            timer: 2500,
            showConfirmButton: true
          });

          setTimeout(() => {
            this.router.navigate(['/booking/my-bookings']);
          }, 2500);
        });

      } catch (err) {
        this.ngZone.run(() => {
          this.errorMessage = 'Payment processing failed. Please try again.';
          this.isLoading.next(false);

          Swal.fire({
            icon: 'error',
            title: 'Processing Error',
            text: 'An error occurred while processing your payment.',
            confirmButtonColor: '#c62828'
          });
        });
      }
    };

    // Use existing client secret if available
    if (this.existingClientSecret) {
      await doConfirm(this.existingClientSecret);
      return;
    }

    // Create new payment intent
    const payload: CreateStripePaymentVM = {
      bookingId: this.bookingId,
      amount: this.amount,
      currency: this.currency,
      description: `Booking #${this.bookingId}`
    };

    this.paymentService.createStripeIntent(payload).subscribe({
      next: async (resp) => {
        if (!resp.success || !resp.result) {
          this.errorMessage = resp.errorMessage || 'Failed to create payment intent.';
          this.isLoading.next(false);

          Swal.fire({
            icon: 'error',
            title: 'Payment Setup Failed',
            text: resp.errorMessage || 'Could not set up payment. Please try again.',
            confirmButtonColor: '#c62828'
          });
          return;
        }

        this.bookingStore.setPaymentIntent(
          resp.result.clientSecret,
          resp.result.paymentIntentId
        );

        await doConfirm(resp.result.clientSecret);
      },
      error: (err) => {
        this.errorMessage = 'Unable to process payment. Please try again.';
        this.isLoading.next(false);

        Swal.fire({
          icon: 'error',
          title: 'Payment Error',
          text: 'Unable to process your payment. Please try again or contact support.',
          confirmButtonColor: '#c62828'
        });
      }
    });
  }

  retryCreateIntent(): void {
    this.errorMessage = '';
    this.intentCreationFailed = false;
    this.intentCreationInProgress = true;

    if (!this.amount || !this.bookingId) {
      this.errorMessage = 'Missing booking data. Please refresh the page.';
      this.intentCreationInProgress = false;
      return;
    }

    const payload: CreateStripePaymentVM = {
      bookingId: this.bookingId,
      amount: this.amount,
      currency: this.currency,
      description: `Booking #${this.bookingId}`
    };

    this.paymentService.createStripeIntent(payload).subscribe({
      next: (resp) => {
        this.intentCreationInProgress = false;

        if (!resp || !resp.success || !resp.result) {
          this.errorMessage = resp?.errorMessage || 'Failed to create payment intent.';
          this.intentCreationFailed = true;
          return;
        }

        this.bookingStore.setPaymentIntent(
          resp.result.clientSecret,
          resp.result.paymentIntentId
        );

        this.existingClientSecret = resp.result.clientSecret;
        this.existingPaymentIntentId = resp.result.paymentIntentId;
        this.intentCreationFailed = false;

      },
      error: (err) => {
        this.errorMessage = 'Failed to create payment intent. Try again.';
        this.intentCreationFailed = true;
        this.intentCreationInProgress = false;
      }
    });
  }
}