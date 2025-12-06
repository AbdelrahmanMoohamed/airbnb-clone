import { Component, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-face-capture',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="face-capture-modal" *ngIf="isOpen" (click)="handleBackdropClick($event)" [attr.dir]="translate.currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div class="face-capture-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>📸 {{ isCapturing ? ('faceCapture.processing' | translate) : ('faceCapture.title' | translate) }}</h2>
          <button type="button" class="close-btn" (click)="closeModal()" [disabled]="isCapturing">
            ✕
          </button>
        </div>

        <div class="video-container" *ngIf="!captureSuccess">
          <video 
            #videoElement 
            autoplay 
            playsinline
            [style.transform]="'scaleX(-1)'"
            (loadedmetadata)="onVideoLoad()">
          </video>
          <canvas 
            #canvasElement 
            style="display: none;">
          </canvas>
          <div class="video-hint" *ngIf="!videoReady" class="loading">
            <div class="spinner"></div>
            <p>{{ 'faceCapture.initializing' | translate }}</p>
          </div>
        </div>

        <div class="capture-success" *ngIf="captureSuccess">
          <div class="success-icon">✓</div>
          <h3>{{ 'faceCapture.successTitle' | translate }}</h3>
          <p>{{ 'faceCapture.successBody' | translate }}</p>
        </div>
        
        <div class="button-group">
          <button 
            type="button" 
            class="btn-capture"
            (click)="captureFrame()"
            [disabled]="isCapturing || !videoReady || captureSuccess">
            {{ isCapturing ? ('faceCapture.processingBtn' | translate) : ('faceCapture.captureBtn' | translate) }}
          </button>
          <button 
            type="button" 
            class="btn-cancel"
            (click)="closeModal()"
            [disabled]="isCapturing">
            {{ captureSuccess ? ('faceCapture.done' | translate) : ('faceCapture.cancel' | translate) }}
          </button>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .face-capture-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        background: rgba(0, 0, 0, 0);
      }
      to {
        background: rgba(0, 0, 0, 0.8);
      }
    }

    .face-capture-content {
      background: white;
      border-radius: 16px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
      overflow: hidden;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #333;
    }

    .close-btn {
      background: #f0f0f0;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .close-btn:hover:not(:disabled) {
      background: #e0e0e0;
      color: #333;
    }

    .close-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .video-container {
      width: 100%;
      background: #000;
      position: relative;
      min-height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .video-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
    }

    .video-hint.loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .capture-success {
      padding: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
      min-height: 350px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    .capture-success h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #2e7d32;
    }

    .capture-success p {
      margin: 0.5rem 0 0 0;
      color: #558b2f;
      font-size: 0.95rem;
    }

    .button-group {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-capture {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex: 1;
    }

    .btn-capture:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-capture:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: #e0e0e0;
      color: #333;
      min-width: 100px;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #d0d0d0;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 1rem;
      margin: 1rem;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #d32f2f;
    }
  `]
})
export class FaceCaptureComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @Output() frameCapture = new EventEmitter<File>();
  @Output() cancel = new EventEmitter<void>();

  isOpen = false;
  isCapturing = false;
  videoReady = false;
  captureSuccess = false;
  errorMessage = '';
  private stream: MediaStream | null = null;

  constructor(private cdr: ChangeDetectorRef, public translate: TranslateService) {}

  async open(): Promise<void> {
    this.isOpen = true;
    this.captureSuccess = false;
    this.errorMessage = '';
    this.videoReady = false;
    this.cdr.markForCheck();
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (err: any) {
      this.errorMessage = err?.name === 'NotAllowedError' 
        ? 'Camera access denied. Please check permissions in browser settings.' 
        : `Unable to access camera: ${err?.message || 'Unknown error'}`;
      console.error('Camera access error:', err);
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  onVideoLoad(): void {
    this.videoReady = true;
    this.cdr.markForCheck();
  }

  captureFrame(): void {
    if (!this.videoElement || !this.canvasElement || !this.videoReady) return;

    try {
      this.isCapturing = true;
      this.cdr.markForCheck();
      
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        this.errorMessage = 'Failed to process image';
        this.isCapturing = false;
        this.cdr.markForCheck();
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror the image (flip horizontally)
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
          this.captureSuccess = true;
          this.cdr.markForCheck();
          
          // Stop camera stream immediately after capture
          this.stopCamera();
          
          // Give user visual feedback, then emit
          setTimeout(() => {
            this.frameCapture.emit(file);
          }, 800);
        } else {
          this.errorMessage = 'Failed to capture image. Please try again.';
          this.cdr.markForCheck();
        }
        this.isCapturing = false;
        this.cdr.markForCheck();
      }, 'image/jpeg', 0.8);
    } catch (err: any) {
      this.errorMessage = `Capture error: ${err?.message || 'Unknown error'}`;
      this.isCapturing = false;
      this.cdr.markForCheck();
      console.error('Capture error:', err);
    }
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isCapturing) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.cancel.emit();
    this.close();
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  private close(): void {
    this.isOpen = false;
    this.videoReady = false;
    this.captureSuccess = false;
    this.errorMessage = '';
    
    this.stopCamera();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.close();
  }
}

