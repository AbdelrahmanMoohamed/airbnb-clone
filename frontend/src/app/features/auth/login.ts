import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FaceCaptureComponent } from './face-capture/face-capture.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, FaceCaptureComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  @ViewChild(FaceCaptureComponent) faceCapture!: FaceCaptureComponent;

  email = '';
  password = '';
  isLoginMode = 'email'; // 'email' or 'face'
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {
    console.log('Login component initialized');
    this.cdr.markForCheck();
  }

  submit() {
    if (this.isLoginMode === 'email') {
      this.submitEmailLogin();
    }
    // Face login is triggered separately via switchToFaceLogin()
  }

  private submitEmailLogin() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.email || !this.password) {
      this.errorMessage = this.translate.instant('auth.emailPasswordRequired') || 'Please enter both email and password';
      return;
    }

    console.log('Submitting login with:', { email: this.email, password: this.password });
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.isLoading = false;
        this.successMessage = this.translate.instant('auth.loginSuccess') || 'Login successful!';
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.navigateAfterLogin();
        }, 800);
      },
      error: err => {
        console.error('Login failed', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.error?.message || err.message,
          errors: err.error?.errors,
          fullError: err.error
        });
        this.isLoading = false;
        this.errorMessage = err?.error?.message || this.translate.instant('auth.loginFailed') || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  switchToFaceLogin() {
    this.isLoginMode = 'face';
    this.errorMessage = '';
    this.successMessage = '';
    this.faceCapture.open();
  }

  switchToEmailLogin() {
    this.isLoginMode = 'email';
    this.errorMessage = '';
    this.successMessage = '';
  }

  onFaceCaptured(file: File) {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.auth.loginWithFace(file).subscribe({
      next: (response) => {
        console.log('Face login response:', response);
        this.isLoading = false;
        this.successMessage = this.translate.instant('auth.loginSuccess') || 'Login successful!';
        this.cdr.markForCheck();
        
        // Close the face capture modal
        this.faceCapture.closeModal();
        
        setTimeout(() => {
          this.navigateAfterLogin();
        }, 800);
      },
      error: (err) => {
        console.error('Face login failed:', err);
        this.isLoading = false;
        this.errorMessage = err?.error?.message || this.translate.instant('auth.faceLoginFailed') || 'Face recognition failed. Please try again or use email/password.';
        this.isLoginMode = 'email';
        
        // Close the face capture modal on error
        this.faceCapture.closeModal();
        
        this.cdr.markForCheck();
      }
    });
  }

  onFaceCaptureCancelled() {
    this.isLoginMode = 'email';
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private navigateAfterLogin() {
    const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';

    if (isFirstLogin) {
      this.router.navigate(['/onboarding']);
    } else if (this.auth.isAdmin()) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
