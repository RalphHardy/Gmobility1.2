import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelEmployeePage } from './sel-employee.page';

describe('SelEmployeePage', () => {
  let component: SelEmployeePage;
  let fixture: ComponentFixture<SelEmployeePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelEmployeePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelEmployeePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
