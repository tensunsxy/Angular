import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import TuiImageEditor from 'tui-image-editor';

@Component({
  selector: 'app-image-editor',
  imports: [],
  templateUrl: './image-editor.html',
  styleUrl: './image-editor.scss',
})
export class ImageEditor implements AfterViewInit {
  @ViewChild('tuiEditor', { static: false }) editorRef!: ElementRef;
  editor!: TuiImageEditor;

  ngAfterViewInit(): void {
    this.editor = new TuiImageEditor(this.editorRef.nativeElement, {
      includeUI: {
        loadImage: {
          path: 'assets/sample.jpg',
          name: 'SampleImage'
        },
        theme: {}, // 后续可加自定义主题
        menu: ['crop', 'flip', 'rotate', 'draw', 'text', 'shape', 'icon'],
        initMenu: 'crop',
        uiSize: {
          width: '100%',
          height: '600px'
        }
      },
      cssMaxWidth: 700,
      cssMaxHeight: 500,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      }
    });
  }
}
