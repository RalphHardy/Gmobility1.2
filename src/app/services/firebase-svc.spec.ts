import { TestBed } from '@angular/core/testing';

import { FirebaseSvcService } from './firebase-svc';

describe('FirebaseSvcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseSvcService = TestBed.get(FirebaseSvcService);
    expect(service).toBeTruthy();
  });
});
