import { TestBed } from '@angular/core/testing';

import { WorkorderDataSvc } from './workorder-data.svc';

describe('WorkorderDataSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const Svc: WorkorderDataSvc = TestBed.get(WorkorderDataSvc);
    expect(Svc).toBeTruthy();
  });
});
