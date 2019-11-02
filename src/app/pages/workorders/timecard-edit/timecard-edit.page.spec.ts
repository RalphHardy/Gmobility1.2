import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimecardEditPage } from './timecard-edit.page';

describe('TimecardEditPage', () => {
  let component: TimecardEditPage;
  let fixture: ComponentFixture<TimecardEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimecardEditPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimecardEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
