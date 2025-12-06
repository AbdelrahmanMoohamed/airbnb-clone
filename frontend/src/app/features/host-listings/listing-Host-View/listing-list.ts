import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ListingService } from '../../../core/services/listings/listing.service';
import { ListingOverviewVM } from '../../../core/models/listing.model';

@Component({
  selector: 'app-listings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './listing-list.html',
  styleUrls: ['./listing-list.css'],
})
export class ListingsList implements OnInit {
  private listingService = inject(ListingService);

  // state
  listings = signal<ListingOverviewVM[]>([]);
  loading = signal<boolean>(false);
  error = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 12;
  totalCount = signal<number>(0);

  // search + filters
  search = signal<string>('');
  destination = signal<string>('');
  type = signal<string>('');
  maxPrice = signal<number | null>(null);
  minRating = signal<number | null>(null);
  isApproved = signal<string>(''); // '', approved, not-approved

  // delete confirmation modal
  showDeleteModal = signal<boolean>(false);
  listingToDelete = signal<number | null>(null);
  listingToDeleteTitle = signal<string>('');

  // computed
  totalPages = computed(() => {
    // Use filtered count for hybrid pagination (server load + client filter)
    const filteredCount = this.filteredListings().length;
    return Math.max(1, Math.ceil(filteredCount / this.pageSize));
  });

  paginationPages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  // Hybrid pagination: server-side load + client-side filtering + client-side pagination
  paginatedListings = computed<ListingOverviewVM[]>(() => {
    const filteredData = this.filteredListings();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return filteredData.slice(startIndex, endIndex);
  });

  // Get unique destinations from all loaded data for filter dropdown
  destinations = computed<string[]>(() => {
    const selectedDest = this.destination().trim();
    
    // If a destination is selected, only show that one
    if (selectedDest) {
      return [selectedDest];
    }
    
    // Otherwise show all available destinations (case-insensitive unique)
    const allDestinations = this.listings()
      .map(l => l.destination)
      .filter((dest): dest is string => !!dest)
      .map(dest => dest.trim()); // Trim whitespace
    
    // Create a Map to store unique destinations (case-insensitive)
    const uniqueDestinations = new Map<string, string>();
    allDestinations.forEach(dest => {
      const lowerKey = dest.toLowerCase();
      if (!uniqueDestinations.has(lowerKey)) {
        uniqueDestinations.set(lowerKey, dest);
      }
    });

    return Array.from(uniqueDestinations.values()).sort((a, b) => a.localeCompare(b));
  });

  // Get unique types from all loaded data for filter dropdown  
  types = computed<string[]>(() => {
    const selectedType = this.type().trim();
    
    // If a type is selected, only show that one
    if (selectedType) {
      return [selectedType];
    }
    
    // Otherwise show all available types (case-insensitive unique)
    const allTypes = this.listings()
      .map(l => l.type)
      .filter((type): type is string => !!type)
      .map(type => type.trim()); // Trim whitespace
    
    // Create a Map to store unique types (case-insensitive)
    const uniqueTypes = new Map<string, string>();
    allTypes.forEach(type => {
      const lowerKey = type.toLowerCase();
      if (!uniqueTypes.has(lowerKey)) {
        uniqueTypes.set(lowerKey, type);
      }
    });

    return Array.from(uniqueTypes.values()).sort((a, b) => a.localeCompare(b));
  });

  // Get current filtered count for display
  filteredCount = computed<number>(() => {
    return this.filteredListings().length;
  });

  // Client-side filtering until backend supports filter parameters
  private normalize(input?: string): string {
    if (!input) return '';
    let s = String(input).trim().toLowerCase();

    s = s.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, '');
    s = s.replace(/أ|إ|آ/g, 'ا');
    s = s.replace(/ة/g, 'ه');
    s = s.replace(/ى/g, 'ي');
    s = s.replace(/ؤ/g, 'و');
    s = s.replace(/ئ/g, 'ي');
    s = s.replace(/ک/g, 'ك').replace(/ی/g, 'ي');
    s = s.replace(/[^0-9a-z\u0600-\u06FF\s]/g, '');
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  }

  filteredListings = computed<ListingOverviewVM[]>(() => {
    const data = this.listings();
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const rawQuery = this.search().trim();
    const rawDest = this.destination().trim();
    const rawType = this.type().trim();
    const approvedFilter = this.isApproved();
    const maxP = this.maxPrice();
    const minR = this.minRating();

    const q = this.normalize(rawQuery);
    const destNormalized = this.normalize(rawDest);
    const typeNormalized = this.normalize(rawType);

    return data.filter(l => {
      const title = this.normalize(l.title);
      const destinationVal = this.normalize(l.destination);
      const typeVal = this.normalize(l.type);
      const description = this.normalize(l.description ?? '');

      const matchesSearch =
        !q ||
        title.includes(q) ||
        destinationVal.includes(q) ||
        description.includes(q);

      const matchesDestination =
        !rawDest || (l.destination?.toLowerCase().includes(rawDest.toLowerCase()) ?? false);

      const matchesType =
        !typeNormalized || typeVal.includes(typeNormalized);

      const matchesApproval =
        approvedFilter === '' ||
        (approvedFilter === 'approved' && l.isApproved === true) ||
        (approvedFilter === 'not-approved' && l.isApproved === false);

      const priceOk =
        (maxP === null || l.pricePerNight <= maxP);

      const ratingOk =
        (minR === null || (l.averageRating ?? 0) >= minR);

      return matchesSearch && matchesDestination && matchesType && matchesApproval && priceOk && ratingOk;
    });
  });

  ngOnInit() {
    this.loadListings();
    
    // Reset to page 1 when filters change (client-side filtering)
    effect(() => {
      // Watch filter signals
      this.search();
      this.destination();
      this.type();
      this.maxPrice();
      this.minRating();
      this.isApproved();
      
      // Reset to first page when any filter changes
      if (this.currentPage() > 1) {
        this.currentPage.set(1);
      }
    });
  }

  loadListings() {
    this.loading.set(true);
    this.error.set('');

    // Load all data from server, then filter client-side
    // Using page 1 with large pageSize to get all host listings
    this.listingService.getHostListings(1, 1000).subscribe({
      next: (response) => {
        if (!response.isError) {
          // Store all listings for client-side filtering
          this.listings.set(response.data || []);
          this.totalCount.set(response.totalCount || 0);
          this.currentPage.set(1); // Reset to first page
        } else {
          this.error.set(response.message || 'Failed to load your listings');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error loading your listings: ' + (err.message || 'Unknown error'));
        this.loading.set(false);
      }
    });
  }

  onDelete(id: number) {
    const listing = this.listings().find(l => l.id === id);
    if (listing) {
      this.listingToDelete.set(id);
      this.listingToDeleteTitle.set(listing.title || 'this listing');
      this.showDeleteModal.set(true);
    }
  }

  confirmDelete() {
    const id = this.listingToDelete();
    if (!id) return;

    this.listingService.delete(id).subscribe({
      next: (response) => {
        if (!response.isError) {
          this.listings.update(list => list.filter(l => l.id !== id));
        } else {
          this.error.set(response.message || 'Failed to delete listing');
        }
        this.closeDeleteModal();
      },
      error: (err) => {
        this.error.set('Error deleting listing: ' + (err.message || 'Unknown error'));
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.listingToDelete.set(null);
    this.listingToDeleteTitle.set('');
  }

  resetFilters() {
    this.search.set('');
    this.destination.set('');
    this.type.set('');
    this.maxPrice.set(null);
    this.minRating.set(null);
    this.isApproved.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  trackById(index: number, item: ListingOverviewVM): number {
    return item.id ?? index;
  }
}