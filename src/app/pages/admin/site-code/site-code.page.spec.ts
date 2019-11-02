import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteCodePage } from './site-code.page';

describe('SiteCodePage', () => {
  let component: SiteCodePage;
  let fixture: ComponentFixture<SiteCodePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteCodePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteCodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
