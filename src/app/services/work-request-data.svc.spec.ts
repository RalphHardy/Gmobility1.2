import { TestBed } from '@angular/core/testing';

import { WorkRequestDataSvc } from './work-request-data.svc';

describe('WorkRequestDataSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const Svc: WorkRequestDataSvc = TestBed.get(WorkRequestDataSvc);
    expect(Svc).toBeTruthy();
  });
});
