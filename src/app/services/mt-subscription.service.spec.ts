import { TestBed } from '@angular/core/testing';

import { MtSubscriptionService } from './mt-subscription.service';

describe('MtSubscriptionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MtSubscriptionService = TestBed.get(MtSubscriptionService);
    expect(service).toBeTruthy();
  });
});
