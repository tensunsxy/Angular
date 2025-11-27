import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, switchMap } from 'rxjs/operators';

export interface AIGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  width?: number;
  height?: number;
  seed?: number;
  image?: string; // Base64 for image-to-image
  mask?: string; // Base64 for inpainting
}

export interface AIGenerationResponse {
  image: string; // Base64 encoded image
  seed?: number;
  model?: string;
  generationTime?: number;
}

export interface AIGenerationProgress {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIImageService {
  private readonly apiEndpoint = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay

  constructor(private http: HttpClient) {}

  /**
   * Generate image from text prompt
   */
  generateImage(request: AIGenerationRequest, apiToken?: string): Observable<AIGenerationResponse> {
    const headers = this.createHeaders(apiToken);
    const payload = this.buildPayload(request);

    return this.http.post<Blob>(this.apiEndpoint, payload, {
      headers,
      responseType: 'blob' as 'json'
    }).pipe(
      retry({
        count: this.maxRetries,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, retryCount);
          
          // Handle rate limiting (429)
          if (error.status === 429) {
            const retryAfter = error.headers.get('Retry-After');
            return timer(retryAfter ? parseInt(retryAfter) * 1000 : delay);
          }
          
          // Handle model loading (503)
          if (error.status === 503) {
            return timer(delay * 2); // Longer delay for model loading
          }
          
          return timer(delay);
        }
      }),
      switchMap(async (blob: Blob) => {
        const base64 = await this.blobToBase64(blob);
        return {
          image: base64,
          model: 'stable-diffusion-xl-base-1.0'
        } as AIGenerationResponse;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Generate image with progress tracking
   */
  generateImageWithProgress(
    request: AIGenerationRequest,
    apiToken?: string,
    onProgress?: (progress: AIGenerationProgress) => void
  ): Observable<AIGenerationResponse> {
    if (onProgress) {
      onProgress({ status: 'pending', message: 'Preparing request...' });
    }

    return new Observable(observer => {
      const startTime = Date.now();
      
      if (onProgress) {
        onProgress({ status: 'generating', progress: 0, message: 'Generating image...' });
      }

      this.generateImage(request, apiToken).subscribe({
        next: (response) => {
          const generationTime = Date.now() - startTime;
          if (onProgress) {
            onProgress({ 
              status: 'completed', 
              progress: 100,
              message: 'Generation completed!'
            });
          }
          observer.next({ ...response, generationTime });
          observer.complete();
        },
        error: (error) => {
          if (onProgress) {
            onProgress({ 
              status: 'error', 
              error: error.message || 'Generation failed'
            });
          }
          observer.error(error);
        }
      });
    });
  }

  /**
   * Batch generate images with different parameters
   */
  batchGenerate(
    baseRequest: AIGenerationRequest,
    variations: Partial<AIGenerationRequest>[],
    apiToken?: string
  ): Observable<AIGenerationResponse[]> {
    const requests = variations.map(variation => ({
      ...baseRequest,
      ...variation
    }));

    // Generate sequentially to respect rate limits
    return new Observable(observer => {
      const results: AIGenerationResponse[] = [];
      let index = 0;

      const generateNext = () => {
        if (index >= requests.length) {
          observer.next(results);
          observer.complete();
          return;
        }

        this.generateImage(requests[index], apiToken).subscribe({
          next: (response) => {
            results.push(response);
            index++;
            // Add delay between requests to avoid rate limiting
            setTimeout(generateNext, 2000);
          },
          error: (error) => {
            observer.error(error);
          }
        });
      };

      generateNext();
    });
  }

  /**
   * Create HTTP headers
   */
  private createHeaders(apiToken?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (apiToken) {
      headers = headers.set('Authorization', `Bearer ${apiToken}`);
    }

    return headers;
  }

  /**
   * Build API payload
   */
  private buildPayload(request: AIGenerationRequest): any {
    const payload: any = {
      inputs: request.prompt
    };

    if (request.negativePrompt) {
      payload.negative_prompt = request.negativePrompt;
    }

    if (request.numInferenceSteps) {
      payload.num_inference_steps = request.numInferenceSteps;
    }

    if (request.guidanceScale) {
      payload.guidance_scale = request.guidanceScale;
    }

    if (request.width && request.height) {
      payload.width = request.width;
      payload.height = request.height;
    }

    if (request.seed !== undefined) {
      payload.seed = request.seed;
    }

    // Image-to-image support
    if (request.image) {
      payload.image = request.image;
    }

    // Inpainting support
    if (request.mask) {
      payload.mask = request.mask;
    }

    return payload;
  }

  /**
   * Convert Blob to Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Error handler
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your parameters.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please check your API token.';
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later.';
          break;
        case 503:
          errorMessage = 'Model is loading. Please wait a moment and try again.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}

