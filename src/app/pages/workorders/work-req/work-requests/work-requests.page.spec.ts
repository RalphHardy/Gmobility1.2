import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestsPage } from './work-requests.page';

describe('WorkRequestsPage', () => {
  let component: WorkRequestsPage;
  let fixture: ComponentFixture<WorkRequestsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkRequestsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkRequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
