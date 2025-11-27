import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageEditor } from './image-editor/image-editor';
import { Toolbar } from './toolbar/toolbar';
import { PropertiesPanel } from './properties-panel/properties-panel';
import { AIGenerationPanel } from './ai-generation-panel/ai-generation-panel';
import { ImageHistory } from './image-history/image-history';

@Component({
  selector: 'app-root',
  imports: [ImageEditor, Toolbar, PropertiesPanel, AIGenerationPanel, ImageHistory],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild(ImageEditor) imageEditor!: ImageEditor;
  selectedTool: string = '';
  
  constructor(private dialog: MatDialog) {}
  
  onToolbarAction(action: string): void {
    if (!this.imageEditor || !this.imageEditor.getEditorInstance()) {
      console.warn('Editor not initialized');
      return;
    }

    const editor = this.imageEditor.getEditorInstance();
    
    // Handle load image action
    if (action === 'load-image') {
      this.loadImage();
      return;
    }
    
    // Open AI generation dialog when AI button is clicked
    if (action === 'ai-generate') {
      this.openAIGenerationDialog();
      // Toggle selected state for AI button
      this.selectedTool = this.selectedTool === 'ai-generate' ? '' : 'ai-generate';
      return;
    }

    // Handle save action
    if (action === 'save') {
      this.imageEditor.downloadImage('edited-image.png');
      return;
    }

    // Handle undo/redo (these don't need selected state)
    if (action === 'undo') {
      this.imageEditor.undo();
      return;
    }

    if (action === 'redo') {
      this.imageEditor.redo();
      return;
    }

    // Set selected tool for tool buttons (crop, filter, text, draw, shape)
    // These buttons should retain their selected state
    const toolButtons = ['crop', 'filter', 'text', 'draw', 'shape'];
    if (toolButtons.includes(action)) {
      // Toggle: if already selected, deselect; otherwise select
      this.selectedTool = this.selectedTool === action ? '' : action;
    }

    // Handle tool selection - activate Tui.ImageEditor's built-in tools
    try {
      switch (action) {
        case 'crop':
          this.imageEditor.startCropMode();
          break;
        case 'draw':
          this.imageEditor.startDrawMode('FREE_DRAWING');
          break;
        case 'text':
          this.imageEditor.startTextMode();
          break;
        case 'shape':
          this.imageEditor.startShapeMode('rect');
          break;
        case 'filter':
          // Filters are handled through Tui.ImageEditor's UI
          // You can trigger filter menu if needed
          console.log('Filter feature - use Tui.ImageEditor UI');
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      // If menu buttons are not found, show a message
      console.warn('Could not find menu buttons. Tui.ImageEditor menu may be hidden.');
    }
  }

  loadImage(): void {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file && this.imageEditor) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB');
          return;
        }
        
        // Load image into editor
        this.imageEditor.loadImageFromFile(file)
          .then(() => {
            console.log('Image loaded successfully');
          })
          .catch((error) => {
            console.error('Error loading image:', error);
            alert('Failed to load image: ' + error.message);
          });
      }
      
      // Clean up
      document.body.removeChild(input);
    };
    
    // Trigger file selection
    document.body.appendChild(input);
    input.click();
  }

  onPropertyChange(change: any): void {
    // Handle property changes from properties panel
    if (!this.imageEditor || !this.imageEditor.getEditorInstance()) {
      return;
    }

    const { property, value } = change;

    try {
      switch (property) {
        case 'fontSize':
          if (this.selectedTool === 'text') {
            this.imageEditor.setTextStyle(value, this.getCurrentTextColor());
          }
          break;
        case 'fontColor':
          if (this.selectedTool === 'text') {
            this.imageEditor.setTextStyle(this.getCurrentFontSize(), value);
          }
          break;
        case 'strokeWidth':
          if (this.selectedTool === 'draw' || this.selectedTool === 'shape') {
            this.imageEditor.setBrushSettings(value, this.getCurrentStrokeColor());
          }
          break;
        case 'strokeColor':
          if (this.selectedTool === 'draw') {
            this.imageEditor.setBrushSettings(this.getCurrentStrokeWidth(), value);
          } else if (this.selectedTool === 'shape') {
            this.imageEditor.setShapeStyle(this.getCurrentStrokeWidth(), value);
          }
          break;
        case 'opacity':
          // Apply opacity to the image
          this.imageEditor.setImageOpacity(value);
          break;
        default:
          console.log('Unknown property:', property);
      }
    } catch (error) {
      console.error('Error applying property change:', error);
    }
  }

  private getCurrentFontSize(): number {
    // Get current font size from properties panel or default
    return 20;
  }

  private getCurrentTextColor(): string {
    // Get current text color from properties panel or default
    return '#000000';
  }

  private getCurrentStrokeWidth(): number {
    // Get current stroke width from properties panel or default
    return 2;
  }

  private getCurrentStrokeColor(): string {
    // Get current stroke color from properties panel or default
    return '#000000';
  }

  openAIGenerationDialog(): void {
    const dialogRef = this.dialog.open(AIGenerationPanel, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'ai-generation-dialog'
    });

    dialogRef.componentInstance.imageGenerated.subscribe((base64Image: string) => {
      this.onAIImageGenerated(base64Image);
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // If dialog closed with an image, load it
        this.onAIImageGenerated(result);
      }
      // Reset selected tool when dialog closes
      if (this.selectedTool === 'ai-generate') {
        this.selectedTool = '';
      }
    });
  }

  onAIImageGenerated(base64Image: string): void {
    // Load generated image into editor using the new method
    this.onImageSelected(base64Image, 'AI Generated Image');
  }

  onImageSelected(base64Image: string, name: string = 'Image'): void {
    // Load image into editor
    if (this.imageEditor) {
      this.imageEditor.loadImageFromBase64(base64Image, name)
        .then(() => {
          console.log('Image loaded into editor');
        })
        .catch((error) => {
          console.error('Error loading image into editor:', error);
          alert('Failed to load image: ' + error.message);
        });
    }
  }
}
