import { Component, EventEmitter, Output, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  @Input() selectedTool: string = '';
  @Output() action = new EventEmitter<string>();

  onAction(action: string): void {
    this.action.emit(action);
  }

  isSelected(action: string): boolean {
    return this.selectedTool === action;
  }
}
