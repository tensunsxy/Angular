import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-properties-panel',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatSliderModule, FormsModule],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss',
})
export class PropertiesPanel {
  @Input() selectedTool: string = '';
  @Output() propertyChange = new EventEmitter<any>();

  // Property values
  fontSize: number = 20;
  fontColor: string = '#000000';
  strokeWidth: number = 2;
  strokeColor: string = '#000000';
  opacity: number = 100;

  onPropertyChange(property: string, value: any): void {
    this.propertyChange.emit({ property, value });
  }

  onFontSizeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fontSize = parseInt(value, 10);
    this.onPropertyChange('fontSize', this.fontSize);
  }

  onColorChange(property: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (property === 'fontColor') {
      this.fontColor = value;
    } else if (property === 'strokeColor') {
      this.strokeColor = value;
    }
    this.onPropertyChange(property, value);
  }

  onStrokeWidthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.strokeWidth = parseInt(value, 10);
    this.onPropertyChange('strokeWidth', this.strokeWidth);
  }

  onOpacityChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.opacity = parseInt(value, 10);
    this.onPropertyChange('opacity', this.opacity);
  }
}
