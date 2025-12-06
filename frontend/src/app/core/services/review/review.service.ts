import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateReviewVM,
  UpdateReviewVM,
  ReviewVM,
  ReviewResponse,
  AddHostReplyVM,
  FlagReviewVM,
  AddReviewImagesVM
} from '../../models/review.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private apiUrl = environment.apiUrl + '/review';

  constructor(private http: HttpClient) {}

  /**
   * Get all reviews for a specific listing
   */
  getReviewsByListing(listingId: number): Observable<ReviewVM[]> {
    return this.http.get<ReviewResponse<ReviewVM[]>>(`${this.apiUrl}/listing/${listingId}`)
      .pipe(
        map(response => response.result || [])
      );
  }

  /**
   * Get all reviews by a specific guest
   */
  getReviewsByGuest(guestId: string): Observable<ReviewVM[]> {
    return this.http.get<ReviewResponse<ReviewVM[]>>(`${this.apiUrl}/guest/${guestId}`)
      .pipe(
        map(response => response.result || [])
      );
  }

  /**
   * Get average rating for a listing
   */
  getAverageRating(listingId: number): Observable<number> {
    return this.http.get<ReviewResponse<number>>(`${this.apiUrl}/listing/${listingId}/avg`)
      .pipe(
        map(response => response.result || 0)
      );
  }

  /**
   * Create a new review
   */
  createReview(model: CreateReviewVM): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}`, model)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Update an existing review
   */
  updateReview(id: number, model: UpdateReviewVM): Observable<ReviewVM> {
    return this.http.put<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}`, model)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Delete a review (Admin only)
   */
  deleteReview(id: number): Observable<boolean> {
    return this.http.delete<ReviewResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Add host reply to a review
   */
  addHostReply(id: number, model: AddHostReplyVM): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}/reply`, model)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Add images to a review
   */
  addReviewImages(id: number, model: AddReviewImagesVM): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}/images`, model)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Vote on review helpfulness
   */
  voteHelpful(id: number, helpful: boolean = true): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}/vote?helpful=${helpful}`, {})
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Flag a review as inappropriate
   */
  flagReview(id: number, model: FlagReviewVM): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}/flag`, model)
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Unflag a review (Admin only)
   */
  unflagReview(id: number): Observable<ReviewVM> {
    return this.http.post<ReviewResponse<ReviewVM>>(`${this.apiUrl}/${id}/unflag`, {})
      .pipe(
        map(response => response.result)
      );
  }

  /**
   * Get all flagged reviews (Admin only)
   */
  getFlaggedReviews(): Observable<ReviewVM[]> {
    return this.http.get<ReviewResponse<ReviewVM[]>>(`${this.apiUrl}/flagged`)
      .pipe(
        map(response => response.result || [])
      );
  }
}
