import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ListingService } from '../../../core/services/listings/listing.service';
import { ListingDetailVM } from '../../../core/models/listing.model';
import { Subscription } from 'rxjs';
import { CreateBooking } from "../../booking/create-booking/create-booking";
import { CreateReviewVM, ReviewVM } from '../../../core/models/review.model';
import { ReviewService } from '../../../core/services/review/review.service';
import { FavoriteStoreService } from '../../../core/services/favoriteService/favorite-store-service';
import { FavoriteButton } from '../../favorites/favorite-button/favorite-button';
import { BookingService, BookingVM } from '../../../core/services/Booking/booking.service';

@Component({
  selector: 'app-listings-detail',
  standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TranslateModule, FavoriteButton],
  templateUrl: './listings-detail.html',
  styleUrls: ['./listings-detail.css'],
})
export class ListingsDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private listingService = inject(ListingService);
  private reviewService = inject(ReviewService);
  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private sub: Subscription | null = null;
  private favoriteStore = inject(FavoriteStoreService);

  listing?: ListingDetailVM;
  loading = true;
  error = '';
  currentImageIndex = 0;
  canEdit = false; // Add edit permission property
  isFavorited = false;


  //Bookings Props
  showBookingForm = false;
  bookingSuccess = false;
  currentBooking: any = null;

  private leaflet: any;
  private detailMap: any | null = null;
Math: any;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      this.loading = true;
      this.error = '';
      this.currentImageIndex = 0;
      const idParam = params.get('id');
      if (idParam) {
        this.loadListing(+idParam);
      } else {
        this.error = 'Listing ID not provided';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.detailMap) {
      try { this.detailMap.remove(); } catch { }
      this.detailMap = null;
    }
    this.leaflet = null;
  }

  private loadListing(id: number): void {
    this.listingService.getById(id).subscribe(
      (response) => {
        if (!response.isError && response.data) {
          this.listing = response.data;
          this.loading = false;
          try { this.cdr.detectChanges(); } catch { }
          void this.initDetailMap();
          this.loadReviews(); // LOAD REVIEWS HERE
          this.loadUserBookings(); // LOAD USER BOOKINGS
        } else {
          this.error = response.message || 'Failed to load listing';
          this.loading = false;
          try { this.cdr.detectChanges(); } catch { }
        }
      },
      (err) => {
        this.error = 'Error loading listing details';
        this.loading = false;
        try { this.cdr.detectChanges(); } catch { }
      }
    );
  }

  private async initDetailMap(): Promise<void> {
    try {
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.listing) return;

      await new Promise(resolve => setTimeout(resolve, 300));

      const el = document.getElementById('detail-map');
      if (!el) return;

      this.leaflet = await import('leaflet');

      if (this.detailMap) {
        try { this.detailMap.remove(); } catch { }
        this.detailMap = null;
      }

      const lat = Number(this.listing.latitude) || 0;
      const lng = Number(this.listing.longitude) || 0;

      this.detailMap = this.leaflet.map(el, {
        center: [lat, lng],
        zoom: 14,
        scrollWheelZoom: false,
        preferCanvas: true,
        zoomAnimation: false
      });

      const svgPin = `
        <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C9.477 0 5 4.477 5 10c0 7.5 10 22 10 22s10-14.5 10-22c0-5.523-4.477-10-10-10z" fill="#d00"/>
          <circle cx="15" cy="11" r="4" fill="#fff"/>
        </svg>
      `;
      const customIcon = this.leaflet.divIcon({
        className: 'custom-leaflet-icon',
        html: svgPin,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -40]
      });

      this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.detailMap);

      const marker = this.leaflet.marker([lat, lng], { icon: customIcon }).addTo(this.detailMap);

      const price = this.listing.pricePerNight ? `<div>${this.listing.pricePerNight} EGP/night</div>` : '';
      const desc = this.listing.description ? `<div style="margin-top:6px;"><small>${this.listing.description}</small></div>` : '';
      const popupHtml = `<b>${this.listing.title}</b>${price}${desc}`;
      marker.bindPopup(popupHtml).openPopup();
    } catch (err) { }
  }

  nextImage(): void {
    if (this.listing?.images) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.listing.images.length;
    }
  }

  prevImage(): void {
    if (this.listing?.images) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.listing.images.length) % this.listing.images.length;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  goBack(): void {
    this.router.navigate(['/host']);
  }

  editListing(): void {
    if (this.listing) {
      this.router.navigate(['/host', this.listing.id, 'edit']);
    }
  }

  // Reviews Props and Methods
  // Reviews Props
  reviews: ReviewVM[] = [];
  visibleReviews: ReviewVM[] = [];
  hasMore = false;
  loadCount = 3;

  overallRating = 0;
  ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  totalReviews = 0;

  newReview = {
    bookingId: 0,
    rating: 0,
    comment: ''
  };

  userBookings: BookingVM[] = []; // current user's bookings
  userBookingsForThisListing: BookingVM[] = []; // filtered bookings for this specific listing
  canWriteReview = false; // user has completed bookings for this listing

  // Edit mode
  editingReviewId: number | null = null;
  editReviewData = { rating: 0, comment: '' };

  // Host reply
  replyingToReviewId: number | null = null;
  hostReplyText = '';

  // Flag review
  flaggingReviewId: number | null = null;
  flagReason = '';

  // Image upload
  uploadingImagesToReviewId: number | null = null;
  reviewImageUrls: string[] = [];

  loadUserBookings() {
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.userBookings = bookings;
        // Filter bookings for this specific listing
        this.userBookingsForThisListing = bookings.filter(b => b.listingId === this.listing?.id);

        // Check if user has completed bookings for this listing
        const hasCompletedBooking = this.userBookingsForThisListing.some(
          b => b.bookingStatus === 'Completed'
        );
        this.canWriteReview = hasCompletedBooking;

        // Auto-select first completed booking
        const firstCompleted = this.userBookingsForThisListing.find(
          b => b.bookingStatus === 'Completed'
        );
        if (firstCompleted) {
          this.newReview.bookingId = firstCompleted.id;
        }

        try { this.cdr.detectChanges(); } catch { }
      },
      error: (err) => {
        console.error('Failed to load user bookings', err);
        this.canWriteReview = false;
      }
    });
  }

  loadReviews() {
    if (!this.listing) return;

    this.reviewService.getReviewsByListing(this.listing.id).subscribe({
      next: (reviews: ReviewVM[]) => {
        this.reviews = reviews;
        this.calculateRatingSummary();
      },
      error: (err) => console.error('Failed to load reviews', err)
    });
  }

  calculateRatingSummary() {
    this.totalReviews = this.reviews.length;
    this.ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (this.totalReviews === 0) {
      this.overallRating = 0;
      this.visibleReviews = [];
      this.hasMore = false;
      return;
    }

    // Count each rating
    this.reviews.forEach(r => {
      const rating = Math.round(r.rating); // ensure integer 1-5
      if (rating >= 1 && rating <= 5) this.ratingCounts[rating]++;
    });

    // Average rating
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.overallRating = Number((sum / this.totalReviews).toFixed(1));

    // Visible reviews
    this.visibleReviews = this.reviews.slice(0, this.loadCount);
    this.hasMore = this.reviews.length > this.loadCount;
  }

  loadMore() {
    if (!this.reviews.length) return;
    this.visibleReviews = this.reviews.slice(0, this.visibleReviews.length + this.loadCount);
    this.hasMore = this.visibleReviews.length < this.reviews.length;
  }

  submitReview() {
    if (this.newReview.bookingId === 0) {
      alert('Please select a booking before submitting your review.');
      return;
    }

    if (this.newReview.rating === 0) {
      alert('Please select a rating for your review.');
      return;
    }

    if (!this.newReview.comment || this.newReview.comment.trim() === '') {
      alert('Please write a comment for your review.');
      return;
    }

    const model: CreateReviewVM = {
      bookingId: this.newReview.bookingId,
      rating: this.newReview.rating,
      comment: this.newReview.comment
    };

    this.reviewService.createReview(model).subscribe({
      next: () => {
        alert('Review submitted successfully!');
        this.loadReviews(); // refresh after submission
        this.newReview.rating = 0;
        this.newReview.comment = '';
        this.newReview.bookingId = 0;
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        alert(err.error?.message || 'Failed to submit review. Please try again.');
      }
    });
  }

  // Optional: method to select booking if user has multiple bookings
  selectBooking(bookingId: number) {
    this.newReview.bookingId = bookingId;
  }

  // Edit review
  startEditReview(review: ReviewVM) {
    this.editingReviewId = review.id;
    this.editReviewData = {
      rating: review.rating,
      comment: review.comment
    };
  }

  cancelEditReview() {
    this.editingReviewId = null;
    this.editReviewData = { rating: 0, comment: '' };
  }

  saveEditReview(reviewId: number) {
    this.reviewService.updateReview(reviewId, this.editReviewData).subscribe({
      next: () => {
        this.loadReviews();
        this.cancelEditReview();
      },
      error: (err) => console.error('Failed to update review', err)
    });
  }

  // Delete review
  deleteReview(reviewId: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (err) => console.error('Failed to delete review', err)
    });
  }

  // Host reply
  startReply(reviewId: number) {
    this.replyingToReviewId = reviewId;
    this.hostReplyText = '';
  }

  cancelReply() {
    this.replyingToReviewId = null;
    this.hostReplyText = '';
  }

  submitHostReply(reviewId: number) {
    if (!this.hostReplyText.trim()) return;

    this.reviewService.addHostReply(reviewId, { reply: this.hostReplyText }).subscribe({
      next: () => {
        this.loadReviews();
        this.cancelReply();
      },
      error: (err) => console.error('Failed to add reply', err)
    });
  }

  // Vote helpful
  voteHelpful(reviewId: number, helpful: boolean) {
    this.reviewService.voteHelpful(reviewId, helpful).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (err) => console.error('Failed to vote', err)
    });
  }

  // Flag review
  startFlag(reviewId: number) {
    this.flaggingReviewId = reviewId;
    this.flagReason = '';
  }

  cancelFlag() {
    this.flaggingReviewId = null;
    this.flagReason = '';
  }

  submitFlag(reviewId: number) {
    if (!this.flagReason.trim()) return;

    this.reviewService.flagReview(reviewId, { reason: this.flagReason }).subscribe({
      next: () => {
        this.loadReviews();
        this.cancelFlag();
        alert('Review has been flagged for moderation');
      },
      error: (err) => console.error('Failed to flag review', err)
    });
  }

  // Add images (placeholder - needs actual upload implementation)
  startUploadImages(reviewId: number) {
    this.uploadingImagesToReviewId = reviewId;
    this.reviewImageUrls = [];
  }

  cancelUploadImages() {
    this.uploadingImagesToReviewId = null;
    this.reviewImageUrls = [];
  }

  submitReviewImages(reviewId: number) {
    if (this.reviewImageUrls.length === 0) return;

    this.reviewService.addReviewImages(reviewId, { imageUrls: this.reviewImageUrls }).subscribe({
      next: () => {
        this.loadReviews();
        this.cancelUploadImages();
      },
      error: (err) => console.error('Failed to add images', err)
    });
  }

  onFavoriteChanged(isFavorited: boolean): void {
    this.isFavorited = isFavorited;
  }

}

