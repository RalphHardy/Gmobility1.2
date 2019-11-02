import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuNoSideComponent } from './menu-no-side.component';

describe('MenuNoSideComponent', () => {
  let component: MenuNoSideComponent;
  let fixture: ComponentFixture<MenuNoSideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenuNoSideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuNoSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
