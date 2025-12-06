import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PropertyMap, GeocodeResponse, MapSearchRequest, MapSearchResponse } from '../../models/map.model';

@Injectable({ providedIn: 'root' })
export class MapService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5235/api/Map';
  private backendOrigin = 'http://localhost:5235';

  private normalizeImageUrl(url?: string): string | undefined {
    if (!url || url.trim() === '') return undefined;
    
    const u = String(url).trim();
    
    // Handle empty or invalid URLs
    if (u === 'null' || u === 'undefined' || u === '') return undefined;
    
    // Already a full URL
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    
    // Relative URL starting with /
    if (u.startsWith('/')) return `${this.backendOrigin}${u}`;
    
    // Filename only - assume it's in listings folder
    return `${this.backendOrigin}/listings/${u}`;
  }
  /**
   * Gets properties within map bounds for displaying pins on the map
   * Takes map viewport bounds with optional filters (price, bedrooms, dates)
   * Used by map component when user pans/zooms to show property markers
   * Returns properties with basic info (price, title, image) for map pins
   */
  getProperties(bounds: MapSearchRequest): Observable<MapSearchResponse> {
    return this.http.get<MapSearchResponse>(`${this.apiUrl}/properties`, {
      params: bounds as any,
    }).pipe(
      //RxJS operator to transform the response
      map(response => {
        const properties: PropertyMap[] = (response.properties || []).map((p: any): PropertyMap => {
          return {
            id: p.id,
            title: p.title ,
            type: p.type ,
            pricePerNight: p.pricePerNight || 0,
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            mainImageUrl: this.normalizeImageUrl(p.mainImageUrl),
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount || 0
          };
        });
        return {
          properties,
          totalCount: response.totalCount || properties.length
        };
      })
    );
  }

  /**
   * Gets detailed info for one specific property by ID
   * Used when user clicks a map marker to see property details
   * Returns full property information for popup/modal windows
   */
  getProperty(id: number): Observable<PropertyMap> {
    return this.http.get<PropertyMap>(`${this.apiUrl}/properties/${id}`).pipe(
      map(response => {
        return {
          id: response.id,
          title: response.title || '',
          type: response.type || 'Property',
          pricePerNight: response.pricePerNight || 0,
          latitude: response.latitude || 0,
          longitude: response.longitude || 0,
          mainImageUrl: this.normalizeImageUrl(response.mainImageUrl),
          bedrooms: response.bedrooms || 0,
          bathrooms: response.bathrooms || 0,
          averageRating: response.averageRating,
          reviewCount: response.reviewCount || 0
        } as PropertyMap;
      })
    );
  }

  /**
   * Converts coordinates to address using backend geocoding service
   * Used when hosts create listings and need to validate location
   * Calls backend API to get formatted address from coordinates
   */
  geocode(latitude: number, longitude: number): Observable<GeocodeResponse> {
    return this.http.post<GeocodeResponse>(`${this.apiUrl}/geocode`, { address: `${latitude},${longitude}` }).pipe(
      map(response => {
        return {
          latitude: response.latitude || latitude,
          longitude: response.longitude || longitude,
          formattedAddress: response.formattedAddress || ''
        } as GeocodeResponse;
      })
    );
  }

  /**
   * Converts latitude/longitude coordinates to human-readable address
   * Uses OpenStreetMap's Nominatim service (external API)
   * Used when hosts drag map pins to set property location
   * Returns formatted address string from coordinates
   */
  reverseGeocode(latitude: number, longitude: number): Observable<GeocodeResponse> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(latitude)
    )}&lon=${encodeURIComponent(String(longitude))}`;
    return this.http.get<any>(url).pipe(
      map((resp) => ({
        formattedAddress: resp.display_name || '',
        latitude: resp.lat ? Number(resp.lat) : latitude,
        longitude: resp.lon ? Number(resp.lon) : longitude
      } as GeocodeResponse))
    );
  }
}