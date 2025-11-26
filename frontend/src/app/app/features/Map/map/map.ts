import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MapService } from '../../../core/services/map/map';
import { PropertyMap } from '../../../core/models/map.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css'],
})
export class MapComponent implements OnInit {
  private map: any;
  private markers: any[] = [];
  properties: PropertyMap[] = [];
  selectedProperty: PropertyMap | null = null;
  isLoading = false;

  private leaflet: any;
  constructor(private mapService: MapService, @Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.leaflet = await import('leaflet');
      // Add some delay to ensure DOM is ready
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  private initMap(): void {
    try {
      console.log('Initializing map...');
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map container element not found!');
        return;
      }

      this.map = this.leaflet.map('map', {
        center: [30.0444, 31.2357], // Cairo
        zoom: 12,
      });

      console.log('Map instance created:', this.map);

      this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      console.log('Tile layer added');

      // Update properties when map moves
      this.map.on('moveend', () => {
        console.log('Map moved, reloading properties');
        this.loadProperties();
      });

      // Initial load
      console.log('Loading initial properties');
      this.loadProperties();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private loadProperties(): void {
    try {
      if (!this.map) {
        console.warn('Map not initialized yet');
        return;
      }

      this.isLoading = true;
      // On initial load, use global bounds to show all properties
      const params = {
        northEastLat: 90,
        northEastLng: 180,
        southWestLat: -90,
        southWestLng: -180,
      };

      console.log('Loading properties with global bounds:', params);

      this.mapService.getProperties(params).subscribe(
        (res: any) => {
          this.isLoading = false;
          this.properties = res.properties || [];
          console.log('Loaded properties:', this.properties);
          this.updateMarkers();
        },
        (error: any) => {
          this.isLoading = false;
          console.error('Error loading properties:', error);
          if (error.error && error.error.Message) {
            console.error('Server error:', error.error.Message);
          }
        }
      );
    } catch (error) {
      this.isLoading = false;
      console.error('Error in loadProperties:', error);
    }
  }

  private updateMarkers(): void {
    try {
      // Remove existing markers
      this.markers.forEach((marker) => marker.remove());
      this.markers = [];

      console.log(`Creating ${this.properties.length} markers`);

      // Add new markers
      this.properties.forEach((p) => {
        try {
          if (!p.latitude || !p.longitude) {
            console.warn(`Property ${p.id} has invalid coordinates:`, p.latitude, p.longitude);
            return;
          }

          const marker = this.leaflet
            .marker([p.latitude, p.longitude])
            .addTo(this.map)
            .bindPopup(`
              <b>${p.title}</b><br>
              ${p.pricePerNight} EGP/night<br>
              ${p.averageRating ? `Rating: ${p.averageRating.toFixed(1)} (${p.reviewCount} reviews)` : 'No reviews yet'}
              ${p.mainImageUrl ? `<br><img src="${p.mainImageUrl}" width="150" style="border-radius: 4px;">` : ''}
            `);

          marker.on('click', () => {
            this.selectedProperty = p;
            console.log('Selected property:', p);
          });

          this.markers.push(marker);
        } catch (error) {
          console.error(`Error creating marker for property ${p.id}:`, error);
        }
      });

      console.log(`Successfully created ${this.markers.length} markers`);
    } catch (error) {
      console.error('Error in updateMarkers:', error);
    }
  }
}