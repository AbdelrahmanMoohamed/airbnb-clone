export interface CreateReviewVM {
  bookingId: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewVM {
  rating: number;
  comment: string;
}

export interface AddHostReplyVM {
  reply: string;
}

export interface FlagReviewVM {
  reason: string;
}

export interface AddReviewImagesVM {
  imageUrls: string[];
}

export interface ReviewVM {
  id: number;
  bookingId: number;
  guestId: string;
  guestName: string;
  guestProfileImg?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;

  // Enhanced features
  hostReply?: string;
  hostReplyDate?: string;
  imageUrls: string[];
  helpfulVotes: number;
  notHelpfulVotes: number;
  isFlagged: boolean;
  flagReason?: string;
  flaggedAt?: string;
}

// Backend API response wrapper
export interface ReviewResponse<T> {
  result: T;
  errorMessage: string | null;
  isHaveErrorOrNo: boolean;
  totalCount: number;
  success: boolean;
}

// For booking selector
export interface UserBookingVM {
  id: number;
  listingId: number;
  listingTitle: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}
