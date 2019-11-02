import { TestBed } from '@angular/core/testing';

import { ApplicVarsSvc } from './applic-vars.svc';

describe('ApplicVarsSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const svc: ApplicVarsSvc = TestBed.get(ApplicVarsSvc);
    expect(svc).toBeTruthy();
  });
});
