export interface MapSearchRequest {
  northEastLat: number;
  northEastLng: number;
  southWestLat: number;
  southWestLng: number;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  checkIn?: string; // ISO string
  checkOut?: string; 
}

export interface PropertyMap {
  id: number;
  title: string;
  type: string;
  pricePerNight: number;
  latitude: number;
  longitude: number;
  mainImageUrl?: string;
  bedrooms: number;
  bathrooms: number;
  averageRating?: number;
  reviewCount: number;
}

// Response DTO matching backend MapSearchResponseDto
export interface MapSearchResponse {
  properties: PropertyMap[];
  totalCount: number;
}

// GeocodeResponse - simplified for location/destination only
export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}
