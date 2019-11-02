import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoNoteEditPage } from './wo-note-edit.page';

describe('WoNoteEditPage', () => {
  let component: WoNoteEditPage;
  let fixture: ComponentFixture<WoNoteEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoNoteEditPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoNoteEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
