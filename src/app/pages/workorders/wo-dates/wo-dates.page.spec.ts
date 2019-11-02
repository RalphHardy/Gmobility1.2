import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoDatesPage } from './wo-dates.page';

describe('WoDatesPage', () => {
  let component: WoDatesPage;
  let fixture: ComponentFixture<WoDatesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoDatesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoDatesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
