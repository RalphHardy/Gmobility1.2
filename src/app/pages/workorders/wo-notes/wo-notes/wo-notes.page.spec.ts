import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoNotesPage } from './wo-notes.page';

describe('WoNotesPage', () => {
  let component: WoNotesPage;
  let fixture: ComponentFixture<WoNotesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoNotesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
