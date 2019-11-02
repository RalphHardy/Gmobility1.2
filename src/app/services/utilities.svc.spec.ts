import { TestBed } from '@angular/core/testing';

import { UtilitiesSvc } from './utilities.svc';

describe('UtilitiesSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UtilitiesSvc = TestBed.get(UtilitiesSvc);
    expect(service).toBeTruthy();
  });
});
