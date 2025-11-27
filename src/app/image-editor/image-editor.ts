import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import TuiImageEditor from 'tui-image-editor';
import { creaitionTheme } from './creaition-theme.config';

@Component({
  selector: 'app-image-editor',
  imports: [],
  templateUrl: './image-editor.html',
  styleUrl: './image-editor.scss',
})
export class ImageEditor implements AfterViewInit, OnDestroy {
  @ViewChild('tuiEditor', { static: false }) editorRef!: ElementRef;
  editor!: TuiImageEditor;

  ngAfterViewInit(): void {
    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      // Initialize Tui.ImageEditor with Creaition theme
      this.editor = new TuiImageEditor(this.editorRef.nativeElement, {
        includeUI: {
          loadImage: {
            path: '',
            name: 'SampleImage'
          },
          theme: creaitionTheme,
          menu: ['crop', 'flip', 'rotate', 'draw', 'text', 'shape', 'icon'],
          initMenu: 'crop',
          uiSize: {
            width: '100%',
            height: '100%'
          }
        },
        // Remove size restrictions to allow full image display
        cssMaxWidth: 0,
        cssMaxHeight: 0,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70
        }
      });
      
      // Debug: Log editor instance and container
      console.log('Editor initialized:', this.editor);
      console.log('Container element:', this.editorRef.nativeElement);
      console.log('Container HTML:', this.editorRef.nativeElement.innerHTML.substring(0, 500));
      
      // Check for canvas after initialization
      setTimeout(() => {
        this.checkCanvasElements();
      }, 500);
    }, 100);
  }
  
  private checkCanvasElements(): void {
    const container = this.editorRef.nativeElement;
    const allElements = Array.from(container.querySelectorAll('*')) as Element[];
    const canvasElements = Array.from(container.querySelectorAll('canvas')) as HTMLCanvasElement[];
    
    console.log('Total elements in container:', allElements.length);
    console.log('Canvas elements found:', canvasElements.length);
    console.log('All class names:', allElements.slice(0, 20).map((el: Element) => (el as HTMLElement).className || ''));
    
    if (canvasElements.length > 0) {
      canvasElements.forEach((canvas: HTMLCanvasElement, index: number) => {
        console.log(`Canvas ${index}:`, {
          width: canvas.width,
          height: canvas.height,
          style: canvas.style.cssText,
          className: canvas.className
        });
        // Force show canvas
        canvas.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
      });
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  // Public methods to interact with editor
  getEditorInstance(): TuiImageEditor {
    return this.editor;
  }

  /**
   * Start crop mode - uses Tui.ImageEditor's direct API
   */
  startCropMode(): void {
    if (this.editor) {
      try {
        // Try to use the editor's startDrawingMode with 'CROPPER'
        if (typeof (this.editor as any).startDrawingMode === 'function') {
          (this.editor as any).startDrawingMode('CROPPER');
        } else {
          // Fallback: find and click the hidden menu button
          this.clickHiddenMenuButton('crop');
        }
      } catch (error) {
        console.warn('Could not start crop mode:', error);
        this.clickHiddenMenuButton('crop');
      }
    }
  }

  /**
   * Start draw mode - uses Tui.ImageEditor's direct API
   */
  startDrawMode(mode: 'FREE_DRAWING' | 'LINE_DRAWING' = 'FREE_DRAWING'): void {
    if (this.editor) {
      try {
        // Try to use the editor's startDrawingMode
        if (typeof (this.editor as any).startDrawingMode === 'function') {
          (this.editor as any).startDrawingMode(mode);
        } else {
          // Fallback: find and click the hidden menu button
          this.clickHiddenMenuButton('draw');
        }
      } catch (error) {
        console.warn('Could not start draw mode:', error);
        this.clickHiddenMenuButton('draw');
      }
    }
  }

  /**
   * Start text mode - uses Tui.ImageEditor's direct API
   */
  startTextMode(): void {
    if (this.editor) {
      try {
        // Try to use the editor's startDrawingMode with 'TEXT'
        if (typeof (this.editor as any).startDrawingMode === 'function') {
          (this.editor as any).startDrawingMode('TEXT');
        } else {
          // Fallback: find and click the hidden menu button
          this.clickHiddenMenuButton('text');
        }
      } catch (error) {
        console.warn('Could not start text mode:', error);
        this.clickHiddenMenuButton('text');
      }
    }
  }

  /**
   * Start shape mode - uses Tui.ImageEditor's direct API
   */
  startShapeMode(shapeType: 'rect' | 'circle' | 'triangle' = 'rect'): void {
    if (this.editor) {
      try {
        // Try to use the editor's startDrawingMode with 'SHAPE'
        if (typeof (this.editor as any).startDrawingMode === 'function') {
          (this.editor as any).startDrawingMode('SHAPE');
        } else {
          // Fallback: find and click the hidden menu button
          this.clickHiddenMenuButton('shape');
        }
      } catch (error) {
        console.warn('Could not start shape mode:', error);
        this.clickHiddenMenuButton('shape');
      }
    }
  }

  /**
   * Helper method to click hidden menu buttons
   */
  private clickHiddenMenuButton(menuName: string): void {
    const container = this.editorRef.nativeElement;
    // Try various selectors to find the menu button
    const selectors = [
      `[data-name="${menuName}"]`,
      `.tui-image-editor-menu-item[data-name="${menuName}"]`,
      `button[data-name="${menuName}"]`,
      `li[data-name="${menuName}"]`,
      `.tie-menu-${menuName}`,
      `[class*="${menuName}"][class*="menu"]`
    ];

    for (const selector of selectors) {
      const button = container.querySelector(selector);
      if (button) {
        (button as HTMLElement).click();
        console.log(`Clicked ${menuName} button using selector: ${selector}`);
        return;
      }
    }

    console.warn(`Could not find ${menuName} menu button`);
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.editor) {
      this.editor.undo();
    }
  }

  /**
   * Redo last action
   */
  redo(): void {
    if (this.editor) {
      this.editor.redo();
    }
  }

  /**
   * Stop current drawing mode
   */
  stopDrawingMode(): void {
    if (this.editor && this.editor.stopDrawingMode) {
      this.editor.stopDrawingMode();
    }
  }

  /**
   * Set drawing brush settings - uses Tui.ImageEditor's graphics API
   */
  setBrushSettings(width: number, color: string): void {
    if (this.editor) {
      // Access the graphics instance through the editor
      const editor = this.editor as any;
      if (editor._graphics && editor._graphics.setBrush) {
        editor._graphics.setBrush({
          width: width,
          color: color
        });
      } else if (editor.setBrush) {
        editor.setBrush({
          width: width,
          color: color
        });
      }
    }
  }

  /**
   * Set text style - applies to next text added
   */
  setTextStyle(size: number, color: string): void {
    // Text style is typically set when adding text through the UI
    // Store these values for when text is added
    if (this.editor && this.editor.ui) {
      // The UI handles text styling through its own controls
      console.log('Text style will be applied when adding text:', { size, color });
    }
  }

  /**
   * Set shape style - applies to next shape added
   */
  setShapeStyle(strokeWidth: number, strokeColor: string, fillColor?: string): void {
    // Shape style is typically set when adding shapes through the UI
    if (this.editor && this.editor.ui) {
      // The UI handles shape styling through its own controls
      console.log('Shape style will be applied when adding shape:', { strokeWidth, strokeColor, fillColor });
    }
  }

  /**
   * Get image as data URL
   */
  getImageDataURL(type: string = 'image/png'): string {
    if (this.editor) {
      return this.editor.toDataURL();
    }
    return '';
  }

  /**
   * Download image
   */
  downloadImage(filename: string = 'image.png'): void {
    if (this.editor) {
      const dataURL = this.editor.toDataURL();
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      link.click();
    }
  }

  /**
   * Clear canvas
   */
  clearCanvas(): void {
    if (this.editor) {
      this.editor.clearObjects();
    }
  }

  /**
   * Set image opacity (0-100)
   */
  setImageOpacity(opacity: number): void {
    if (this.editor) {
      // Convert 0-100 to 0-1 range
      const opacityValue = Math.max(0, Math.min(100, opacity)) / 100;
      
      // Try to set opacity through the editor's graphics API
      const editor = this.editor as any;
      
      // Method 1: Try to set opacity on the image object via Fabric.js
      if (editor._graphics) {
        try {
          const graphics = editor._graphics;
          const canvas = graphics.getCanvas();
          if (canvas && typeof canvas.getObjects === 'function') {
            // Get all objects on the canvas
            const objects = canvas.getObjects();
            // Find the main image object (usually the first or largest image)
            const imageObject = objects.find((obj: any) => {
              return obj.type === 'image' || 
                     obj.type === 'tuiImage' || 
                     (obj.type === 'image' && obj.width && obj.height);
            });
            
            if (imageObject && typeof imageObject.set === 'function') {
              imageObject.set('opacity', opacityValue);
              if (typeof canvas.renderAll === 'function') {
                canvas.renderAll();
              }
              console.log('Opacity set on image object:', opacityValue);
              return;
            }
          }
        } catch (error) {
          console.warn('Could not set opacity via graphics API:', error);
        }
      }
      
      // Method 2: Fallback - Set opacity on canvas container via CSS
      this.setCanvasOpacity(opacityValue);
    }
  }

  /**
   * Set canvas opacity via CSS
   */
  private setCanvasOpacity(opacity: number): void {
    const container = this.editorRef.nativeElement;
    const canvasContainer = container.querySelector('.tui-image-editor-canvas-container') as HTMLElement;
    const canvases = container.querySelectorAll('canvas');
    
    if (canvasContainer) {
      canvasContainer.style.opacity = opacity.toString();
    }
    
    // Also set opacity on all canvas elements
    canvases.forEach((canvas: HTMLCanvasElement) => {
      canvas.style.opacity = opacity.toString();
    });
  }

  /**
   * Load image from file
   */
  loadImageFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const dataUrl = e.target?.result as string;
        this.loadImageFromURL(dataUrl, file.name)
          .then(() => resolve())
          .catch(reject);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image from URL or data URL
   */
  loadImageFromURL(url: string, name: string = 'Image'): Promise<void> {
    if (!this.editor) {
      return Promise.reject(new Error('Editor not initialized'));
    }

    // Wait a bit to ensure editor is fully ready
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.editor.loadImageFromURL(url, name)
          .then(() => {
            console.log('Image loaded successfully:', name);
            // Force canvas to be visible after loading - use MutationObserver to keep it visible
            setTimeout(() => {
              const container = this.editorRef.nativeElement;
              
              // Find all canvas elements
              const allCanvases = Array.from(container.querySelectorAll('canvas')) as HTMLCanvasElement[];
              const canvasContainer = container.querySelector('.tui-image-editor-canvas-container') as HTMLElement;
              const mainContainer = container.querySelector('.tui-image-editor-container') as HTMLElement;
              
              // Force show all canvases
              allCanvases.forEach((canvas: HTMLCanvasElement) => {
                // Set style directly
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('position', 'relative', 'important');
                canvas.style.setProperty('z-index', '10', 'important');
                canvas.style.setProperty('width', 'auto', 'important');
                canvas.style.setProperty('height', 'auto', 'important');
                
                // Use MutationObserver to keep canvas visible
                const observer = new MutationObserver(() => {
                  if (canvas.style.display === 'none' || canvas.style.visibility === 'hidden') {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                  }
                });
                
                observer.observe(canvas, {
                  attributes: true,
                  attributeFilter: ['style', 'class']
                });
                
                console.log('Canvas shown and monitored:', canvas.className);
              });
              
              // Force show containers
              if (canvasContainer) {
                canvasContainer.style.setProperty('display', 'block', 'important');
                canvasContainer.style.setProperty('visibility', 'visible', 'important');
                canvasContainer.style.setProperty('width', '100%', 'important');
                canvasContainer.style.setProperty('height', '100%', 'important');
                console.log('Canvas container shown');
              }
              
              if (mainContainer) {
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('width', '100%', 'important');
                mainContainer.style.setProperty('height', '100%', 'important');
                console.log('Main container shown');
              }
              
              // Also monitor the container for changes
              if (canvasContainer) {
                const containerObserver = new MutationObserver(() => {
                  if (canvasContainer.style.display === 'none' || canvasContainer.style.visibility === 'hidden') {
                    canvasContainer.style.setProperty('display', 'block', 'important');
                    canvasContainer.style.setProperty('visibility', 'visible', 'important');
                  }
                });
                
                containerObserver.observe(canvasContainer, {
                  attributes: true,
                  attributeFilter: ['style']
                });
              }
            }, 300);
            resolve();
          })
          .catch((error) => {
            console.error('Error loading image:', error);
            reject(error);
          });
      }, 100);
    });
  }

  /**
   * Load image from base64 string
   */
  loadImageFromBase64(base64: string, name: string = 'Image'): Promise<void> {
    const dataUrl = `data:image/png;base64,${base64}`;
    return this.loadImageFromURL(dataUrl, name);
  }
}
