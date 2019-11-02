import { TestBed } from '@angular/core/testing';

import { LsoRequestsService } from './lso-requests.service';

describe('LsoRequestsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LsoRequestsService = TestBed.get(LsoRequestsService);
    expect(service).toBeTruthy();
  });
});
