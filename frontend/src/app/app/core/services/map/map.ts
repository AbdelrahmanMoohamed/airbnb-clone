import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MapService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5235/api/Map';

  getProperties(bounds: any) {
    return this.http.get<any>(`${this.apiUrl}/properties`, {
      params: bounds,
    }).pipe(
      map(response => ({
        properties: (response.properties || response.Properties || []).map((p: any) => ({
          id: p.id || p.Id,
          title: p.title || p.Title,
          pricePerNight: p.pricePerNight || p.PricePerNight,
          latitude: p.latitude || p.Latitude,
          longitude: p.longitude || p.Longitude,
          mainImageUrl: p.mainImageUrl || p.MainImageUrl,
          averageRating: p.averageRating || p.AverageRating,
          reviewCount: p.reviewCount || p.ReviewCount
        }))
      }))
    );
  }
}