import { Component, OnInit, EventEmitter, Output, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AIImageService, AIGenerationRequest, AIGenerationProgress } from '../services/ai-image.service';
import { AIStateService } from '../services/ai-state.service';

@Component({
  selector: 'app-ai-generation-panel',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatSelectModule,
    MatProgressBarModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './ai-generation-panel.html',
  styleUrl: './ai-generation-panel.scss'
})
export class AIGenerationPanel implements OnInit {
  @Output() imageGenerated = new EventEmitter<string>(); // Base64 image

  generationForm: FormGroup;
  progress: AIGenerationProgress | null = null;
  promptSuggestions: string[] = [
    'a beautiful landscape',
    'portrait of a person',
    'futuristic city',
    'abstract art',
    'cute animals',
    'fantasy character',
    'cyberpunk style',
    'vintage photograph'
  ];
  showAdvanced = false;

  constructor(
    private fb: FormBuilder,
    private aiService: AIImageService,
    private stateService: AIStateService,
    public dialogRef?: MatDialogRef<AIGenerationPanel>,
    @Inject(MAT_DIALOG_DATA) public data?: any
  ) {
    this.generationForm = this.createForm();
  }

  ngOnInit(): void {
    const preferences = this.stateService.getPreferences();
    
    // Load saved preferences
    this.generationForm.patchValue({
      width: preferences.defaultWidth,
      height: preferences.defaultHeight,
      steps: preferences.defaultSteps,
      guidanceScale: preferences.defaultGuidanceScale
    });

    // Load current prompt if exists
    const currentPrompt = this.stateService.getState().currentPrompt;
    if (currentPrompt) {
      this.generationForm.patchValue({ prompt: currentPrompt });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      prompt: ['', [Validators.required, Validators.minLength(3)]],
      negativePrompt: [''],
      width: [512, [Validators.min(256), Validators.max(1024)]],
      height: [512, [Validators.min(256), Validators.max(1024)]],
      steps: [50, [Validators.min(10), Validators.max(100)]],
      guidanceScale: [7.5, [Validators.min(1), Validators.max(20)]],
      seed: [null]
    });
  }

  onGenerate(): void {
    if (this.generationForm.invalid) {
      return;
    }

    const formValue = this.generationForm.value;
    const preferences = this.stateService.getPreferences();

    const request: AIGenerationRequest = {
      prompt: formValue.prompt,
      negativePrompt: formValue.negativePrompt || undefined,
      width: formValue.width,
      height: formValue.height,
      numInferenceSteps: formValue.steps,
      guidanceScale: formValue.guidanceScale,
      seed: formValue.seed || undefined
    };

    this.stateService.setLoading(true);
    this.stateService.setCurrentPrompt(formValue.prompt);
    this.progress = { status: 'pending', message: 'Preparing...' };

    this.aiService.generateImageWithProgress(
      request,
      preferences.apiToken,
      (progress) => {
        this.progress = progress;
      }
    ).subscribe({
      next: (response) => {
        // Save to state
        this.stateService.addGeneratedImage({
          prompt: formValue.prompt,
          negativePrompt: formValue.negativePrompt,
          image: response.image,
          model: response.model || 'stable-diffusion-xl-base-1.0',
          seed: response.seed,
          parameters: {
            width: formValue.width,
            height: formValue.height,
            steps: formValue.steps,
            guidanceScale: formValue.guidanceScale
          }
        });

        // Emit to parent
        this.imageGenerated.emit(response.image);
        
        this.progress = { status: 'completed', progress: 100 };
        this.stateService.setLoading(false);
        
        // Close dialog after successful generation
        if (this.dialogRef) {
          setTimeout(() => {
            this.dialogRef?.close(response.image);
          }, 1000); // Close after 1 second to show completion
        }
      },
      error: (error) => {
        this.stateService.setError(error.message);
        this.stateService.setLoading(false);
        this.progress = { status: 'error', error: error.message };
      }
    });
  }

  onUseSuggestion(suggestion: string): void {
    this.generationForm.patchValue({ prompt: suggestion });
  }

  onToggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  onCancel(): void {
    // Note: HttpClient doesn't support cancellation easily
    // In production, you'd use AbortController
    this.progress = null;
    this.stateService.setLoading(false);
  }

  get isLoading(): boolean {
    return this.stateService.getState().isLoading;
  }

  get error(): string | null {
    return this.stateService.getState().error;
  }
}

