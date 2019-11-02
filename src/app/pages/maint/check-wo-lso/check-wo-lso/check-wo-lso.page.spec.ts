import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckWoLsoPage } from './check-wo-lso.page';

describe('CheckWoLsoPage', () => {
  let component: CheckWoLsoPage;
  let fixture: ComponentFixture<CheckWoLsoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckWoLsoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckWoLsoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
