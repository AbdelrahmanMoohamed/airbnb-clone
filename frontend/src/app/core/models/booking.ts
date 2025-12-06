export interface CreateBookingVM {
  listingId: number;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  guests: number;
  paymentMethod: string;
}

export interface GetBookingVM {
  id: number;
  listingId: number;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  totalPrice: number;
  bookingStatus: string;
  paymentStatus: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

export interface BookingResponse {
  success: boolean;
  result?: GetBookingVM | null;
  errorMessage?: string;
}

export interface BookingsResponse {
  success: boolean;
  result?: GetBookingVM[];
  errorMessage?: string;
}
// Helper function to check if booking can be paid
export function canRetryPayment(booking: GetBookingVM): boolean {
  const bookingStatus = booking.bookingStatus?.toLowerCase();
  const paymentStatus = booking.paymentStatus?.toLowerCase();
  
  return (
    (bookingStatus === 'pending' || bookingStatus === 'confirmed') &&
    (paymentStatus === 'pending' || paymentStatus === 'failed')
  );
}