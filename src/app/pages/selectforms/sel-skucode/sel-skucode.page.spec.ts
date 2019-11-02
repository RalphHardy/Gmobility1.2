import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelSkucodePage } from './sel-skucode.page';

describe('SelSkucodePage', () => {
  let component: SelSkucodePage;
  let fixture: ComponentFixture<SelSkucodePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelSkucodePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelSkucodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
