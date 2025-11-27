import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AIStateService, GeneratedImage } from '../services/ai-state.service';

@Component({
  selector: 'app-image-history',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './image-history.html',
  styleUrl: './image-history.scss'
})
export class ImageHistory implements OnInit {
  @Output() imageSelected = new EventEmitter<string>(); // Base64 image

  images: GeneratedImage[] = [];
  favorites: GeneratedImage[] = [];
  showFavoritesOnly = false;

  constructor(private stateService: AIStateService) {}

  ngOnInit(): void {
    this.loadImages();
    this.stateService.getStateObservable().subscribe(() => {
      this.loadImages();
    });
  }

  loadImages(): void {
    const state = this.stateService.getState();
    this.images = state.generatedImages;
    this.favorites = state.generatedImages.filter(img => 
      state.favorites.includes(img.id)
    );
  }

  onImageClick(image: GeneratedImage): void {
    this.imageSelected.emit(image.image);
  }

  onToggleFavorite(image: GeneratedImage): void {
    this.stateService.toggleFavorite(image.id);
  }

  onDeleteImage(image: GeneratedImage, event: Event): void {
    event.stopPropagation();
    this.stateService.removeGeneratedImage(image.id);
  }

  onClearHistory(): void {
    if (confirm('Are you sure you want to clear all history?')) {
      this.stateService.clearHistory();
    }
  }

  get displayedImages(): GeneratedImage[] {
    return this.showFavoritesOnly ? this.favorites : this.images;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  isFavorite(imageId: string): boolean {
    return this.stateService.getState().favorites.includes(imageId);
  }
}

