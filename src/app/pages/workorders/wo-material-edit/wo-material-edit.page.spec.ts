import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoMaterialEditPage } from './wo-material-edit.page';

describe('WoMaterialEditPage', () => {
  let component: WoMaterialEditPage;
  let fixture: ComponentFixture<WoMaterialEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoMaterialEditPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoMaterialEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
