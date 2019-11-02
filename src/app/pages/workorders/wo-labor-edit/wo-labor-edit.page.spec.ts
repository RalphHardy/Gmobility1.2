import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoLaborEditPage } from './wo-labor-edit.page';

describe('WoLaborEditPage', () => {
  let component: WoLaborEditPage;
  let fixture: ComponentFixture<WoLaborEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoLaborEditPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoLaborEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
