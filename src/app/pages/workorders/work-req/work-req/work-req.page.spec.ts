import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkReqPage } from './work-req.page';

describe('WorkReqPage', () => {
  let component: WorkReqPage;
  let fixture: ComponentFixture<WorkReqPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkReqPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkReqPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
