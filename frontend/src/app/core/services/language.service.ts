import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SupportedLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);

  private readonly STORAGE_KEY = 'app_language';
  private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ar'];
  private readonly DEFAULT_LANGUAGE: SupportedLanguage = 'en';

  private currentLanguageSubject = new BehaviorSubject<SupportedLanguage>(this.DEFAULT_LANGUAGE);
  public currentLanguage$: Observable<SupportedLanguage> = this.currentLanguageSubject.asObservable();

  constructor() {
    // Set default language for TranslateService
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);

    // Add supported languages
    this.translate.addLangs(this.SUPPORTED_LANGUAGES);

    // Initialize language with auto-detection
    this.initializeLanguage();
  }

  /**
   * Initialize language with auto-detection priority:
   * 1. localStorage
   * 2. Query parameter ?lang=
   * 3. Browser Accept-Language
   * 4. Default (en)
   */
  private initializeLanguage(): void {
    const detectedLang = this.detectLanguage();
    this.setLanguage(detectedLang, false);
  }

  /**
   * Detect language based on priority
   */
  private detectLanguage(): SupportedLanguage {
    // 1. Check localStorage
    const storedLang = this.getStoredLanguage();
    if (storedLang) {
      console.log('Language from localStorage:', storedLang);
      return storedLang;
    }

    // 2. Check query parameter
    const queryLang = this.getLanguageFromQuery();
    if (queryLang) {
      console.log('Language from query param:', queryLang);
      return queryLang;
    }

    // 3. Check browser language
    const browserLang = this.getBrowserLanguage();
    if (browserLang) {
      console.log('Language from browser:', browserLang);
      return browserLang;
    }

    // 4. Default
    console.log('Using default language:', this.DEFAULT_LANGUAGE);
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Get language from localStorage
   */
  private getStoredLanguage(): SupportedLanguage | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.isSupportedLanguage(stored)) {
        return stored as SupportedLanguage;
      }
    } catch (error) {
      console.error('Error reading language from localStorage:', error);
    }
    return null;
  }

  /**
   * Get language from URL query parameter
   */
  private getLanguageFromQuery(): SupportedLanguage | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');

    if (lang && this.isSupportedLanguage(lang)) {
      return lang as SupportedLanguage;
    }
    return null;
  }

  /**
   * Get language from browser settings
   */
  private getBrowserLanguage(): SupportedLanguage | null {
    if (typeof navigator === 'undefined') return null;

    const browserLang = navigator.language.split('-')[0];
    if (this.isSupportedLanguage(browserLang)) {
      return browserLang as SupportedLanguage;
    }
    return null;
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(lang: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  }

  /**
   * Set the current language
   * @param lang Language code
   * @param save Whether to save to localStorage
   */
  public setLanguage(lang: SupportedLanguage, save: boolean = true): void {
    if (!this.isSupportedLanguage(lang)) {
      console.warn(`Language '${lang}' not supported. Using default.`);
      lang = this.DEFAULT_LANGUAGE;
    }

    // Update ngx-translate and wait for it to load
    this.translate.use(lang).subscribe({
      next: (translations) => {
        console.log('Translations loaded for:', lang, translations);
      },
      error: (err) => {
        console.error('Error loading translations for', lang, err);
      }
    });

    // Update document attributes
    this.updateDocumentAttributes(lang);

    // Save to localStorage
    if (save) {
      this.saveLanguage(lang);
    }

    // Update subject
    this.currentLanguageSubject.next(lang);

    console.log('Language set to:', lang);
  }

  /**
   * Switch to a different language
   */
  public switchLanguage(lang: SupportedLanguage): void {
    this.setLanguage(lang, true);
  }

  /**
   * Update document lang and dir attributes
   */
  private updateDocumentAttributes(lang: SupportedLanguage): void {
    const htmlElement = document.documentElement;

    // Set lang attribute
    htmlElement.setAttribute('lang', lang);

    // Set dir attribute (rtl for Arabic, ltr for others)
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    htmlElement.setAttribute('dir', direction);

    console.log(`Document attributes updated: lang=${lang}, dir=${direction}`);
  }

  /**
   * Save language to localStorage
   */
  private saveLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
  }

  /**
   * Get current language code
   */
  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguageSubject.value;
  }

  /**
   * Get current direction (rtl/ltr)
   */
  public getCurrentDirection(): 'rtl' | 'ltr' {
    return this.getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Check if current language is RTL
   */
  public isRTL(): boolean {
    return this.getCurrentDirection() === 'rtl';
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Get translation for a key
   */
  public instant(key: string, params?: object): string {
    return this.translate.instant(key, params);
  }

  /**
   * Get translation observable for a key
   */
  public get(key: string, params?: object): Observable<string> {
    return this.translate.get(key, params);
  }
}
