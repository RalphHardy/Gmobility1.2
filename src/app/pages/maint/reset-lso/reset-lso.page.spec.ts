import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetLsoPage } from './reset-lso.page';

describe('ResetLsoPage', () => {
  let component: ResetLsoPage;
  let fixture: ComponentFixture<ResetLsoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResetLsoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetLsoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
