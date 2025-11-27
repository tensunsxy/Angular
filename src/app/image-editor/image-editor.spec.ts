import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageEditor } from './image-editor';

describe('ImageEditor', () => {
  let component: ImageEditor;
  let fixture: ComponentFixture<ImageEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
