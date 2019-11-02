import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkorderCreatePage } from './workorder-create.page';

describe('WorkorderCreatePage', () => {
  let component: WorkorderCreatePage;
  let fixture: ComponentFixture<WorkorderCreatePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkorderCreatePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkorderCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
