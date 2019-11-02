import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayLsoPage } from './display-lso.page';

describe('DisplayLsoPage', () => {
  let component: DisplayLsoPage;
  let fixture: ComponentFixture<DisplayLsoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayLsoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayLsoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
