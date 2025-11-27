import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  image: string; // Base64
  model: string;
  timestamp: number;
  seed?: number;
  parameters?: any;
  isFavorite?: boolean;
}

export interface AIState {
  generatedImages: GeneratedImage[];
  favorites: string[]; // Image IDs
  currentPrompt: string;
  currentModel: string;
  isLoading: boolean;
  error: string | null;
  userPreferences: {
    defaultModel: string;
    defaultWidth: number;
    defaultHeight: number;
    defaultSteps: number;
    defaultGuidanceScale: number;
    apiToken?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AIStateService {
  private readonly STORAGE_KEY = 'ai_image_editor_state';
  private readonly STORAGE_PREFERENCES_KEY = 'ai_image_editor_preferences';

  private stateSubject = new BehaviorSubject<AIState>(this.getInitialState());
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.loadStateFromStorage();
  }

  /**
   * Get current state
   */
  getState(): AIState {
    return this.stateSubject.value;
  }

  /**
   * Get state as observable
   */
  getStateObservable(): Observable<AIState> {
    return this.state$;
  }

  /**
   * Get generated images
   */
  getGeneratedImages(): Observable<GeneratedImage[]> {
    return this.state$.pipe(map(state => state.generatedImages));
  }

  /**
   * Get favorites
   */
  getFavorites(): Observable<GeneratedImage[]> {
    return this.state$.pipe(
      map(state => 
        state.generatedImages.filter(img => state.favorites.includes(img.id))
      )
    );
  }

  /**
   * Add generated image
   */
  addGeneratedImage(image: Omit<GeneratedImage, 'id' | 'timestamp'>): void {
    const newImage: GeneratedImage = {
      ...image,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      generatedImages: [newImage, ...currentState.generatedImages],
      isLoading: false,
      error: null
    };

    this.updateState(newState);
  }

  /**
   * Remove generated image
   */
  removeGeneratedImage(imageId: string): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      generatedImages: currentState.generatedImages.filter(img => img.id !== imageId),
      favorites: currentState.favorites.filter(id => id !== imageId)
    };

    this.updateState(newState);
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(imageId: string): void {
    const currentState = this.stateSubject.value;
    const favorites = currentState.favorites.includes(imageId)
      ? currentState.favorites.filter(id => id !== imageId)
      : [...currentState.favorites, imageId];

    const newState: AIState = {
      ...currentState,
      favorites
    };

    this.updateState(newState);
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      isLoading,
      error: isLoading ? null : currentState.error
    };

    this.updateState(newState);
  }

  /**
   * Set error
   */
  setError(error: string | null): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      error,
      isLoading: false
    };

    this.updateState(newState);
  }

  /**
   * Set current prompt
   */
  setCurrentPrompt(prompt: string): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      currentPrompt: prompt
    };

    this.updateState(newState);
  }

  /**
   * Set current model
   */
  setCurrentModel(model: string): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      currentModel: model
    };

    this.updateState(newState);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<AIState['userPreferences']>): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      userPreferences: {
        ...currentState.userPreferences,
        ...preferences
      }
    };

    this.updateState(newState);
    this.savePreferencesToStorage(newState.userPreferences);
  }

  /**
   * Get user preferences
   */
  getPreferences(): AIState['userPreferences'] {
    return this.stateSubject.value.userPreferences;
  }

  /**
   * Clear all generated images
   */
  clearHistory(): void {
    const currentState = this.stateSubject.value;
    const newState: AIState = {
      ...currentState,
      generatedImages: [],
      favorites: []
    };

    this.updateState(newState);
  }

  /**
   * Update state
   */
  private updateState(newState: AIState): void {
    this.stateSubject.next(newState);
    this.saveStateToStorage(newState);
  }

  /**
   * Get initial state
   */
  private getInitialState(): AIState {
    return {
      generatedImages: [],
      favorites: [],
      currentPrompt: '',
      currentModel: 'stable-diffusion-xl-base-1.0',
      isLoading: false,
      error: null,
      userPreferences: {
        defaultModel: 'stable-diffusion-xl-base-1.0',
        defaultWidth: 512,
        defaultHeight: 512,
        defaultSteps: 50,
        defaultGuidanceScale: 7.5
      }
    };
  }

  /**
   * Load state from localStorage
   */
  private loadStateFromStorage(): void {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      const savedPreferences = localStorage.getItem(this.STORAGE_PREFERENCES_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);
        const initialState = this.getInitialState();
        
        // Merge with saved state, but limit history to last 50 images
        const state: AIState = {
          ...initialState,
          ...parsed,
          generatedImages: (parsed.generatedImages || []).slice(0, 50),
          userPreferences: savedPreferences 
            ? { ...initialState.userPreferences, ...JSON.parse(savedPreferences) }
            : initialState.userPreferences
        };

        this.stateSubject.next(state);
      }

      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          userPreferences: {
            ...currentState.userPreferences,
            ...preferences
          }
        });
      }
    } catch (error) {
      console.error('Error loading state from storage:', error);
    }
  }

  /**
   * Save state to localStorage
   */
  private saveStateToStorage(state: AIState): void {
    try {
      const stateToSave = {
        generatedImages: state.generatedImages.slice(0, 50), // Limit to 50 images
        favorites: state.favorites,
        currentPrompt: state.currentPrompt,
        currentModel: state.currentModel
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to storage:', error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferencesToStorage(preferences: AIState['userPreferences']): void {
    try {
      // Don't save API token to localStorage for security
      const { apiToken, ...preferencesToSave } = preferences;
      localStorage.setItem(this.STORAGE_PREFERENCES_KEY, JSON.stringify(preferencesToSave));
    } catch (error) {
      console.error('Error saving preferences to storage:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

