import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/**
 * First-time user onboarding walkthrough component
 * Shows a guided tour of the application's key features
 * After completion, marks user's onboarding as complete in the backend
 */
@Component({
  selector: 'app-onboarding-walkthrough',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-walkthrough.html',
  styleUrls: ['./onboarding-walkthrough.css']
})
export class OnboardingWalkthrough implements OnInit {
  currentStep = 0;

  steps = [
    {
      title: 'Welcome to Luxuy! ✨',
      description: 'Your journey to finding perfect accommodations starts here. Let us show you around!',
      icon: '🏠'
    },
    {
      title: 'Discover Amazing Listings',
      description: 'Browse through thousands of verified properties worldwide. Use filters to find exactly what you need.',
      icon: '🔍'
    },
    {
      title: 'Book with Confidence',
      description: 'Secure booking process with instant confirmations. Your payments are protected.',
      icon: '🔒'
    },
    {
      title: 'Stay Connected',
      description: 'Chat with hosts directly, receive real-time notifications, and manage your bookings effortlessly.',
      icon: '💬'
    },
    {
      title: 'Become a Host',
      description: 'Have a property? List it and start earning! Switch to host mode anytime from your profile.',
      icon: '🏡'
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Check if user should see onboarding
    const isFirstLogin = localStorage.getItem('isFirstLogin');
    if (isFirstLogin !== 'true') {
      // User has already completed onboarding, redirect to home
      this.router.navigate(['/home']);
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    } else {
      this.completeOnboarding();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  skipOnboarding() {
    if (confirm('Are you sure you want to skip the walkthrough? You can always access help from your profile.')) {
      this.completeOnboarding();
    }
  }

  /**
   * Mark onboarding as completed on backend and frontend
   * Then redirect user to home page
   */
  completeOnboarding() {
    const apiBase = 'http://localhost:5235/api/auth';

    // Call backend to mark onboarding as complete
    this.http.put(`${apiBase}/complete-onboarding`, {}).subscribe({
      next: () => {
        console.log('✓ Onboarding marked as complete on backend');
        // Update local storage so user doesn't see this again
        localStorage.setItem('isFirstLogin', 'false');
        // Navigate to home page
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Failed to complete onboarding on backend:', err);
        // Still update local storage and navigate
        // (backend will be updated on next login if this fails)
        localStorage.setItem('isFirstLogin', 'false');
        this.router.navigate(['/home']);
      }
    });
  }

  get progress(): number {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }
}
