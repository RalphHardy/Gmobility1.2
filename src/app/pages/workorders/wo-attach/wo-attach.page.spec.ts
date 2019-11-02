import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoAttachPage } from './wo-attach.page';

describe('WoAttachPage', () => {
  let component: WoAttachPage;
  let fixture: ComponentFixture<WoAttachPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoAttachPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoAttachPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
