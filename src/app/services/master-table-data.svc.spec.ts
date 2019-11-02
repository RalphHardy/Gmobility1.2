import { TestBed } from '@angular/core/testing';

import { MasterTableDataSvc } from './master-table-data.svc';

describe('MasterTableDataSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const Svc: MasterTableDataSvc = TestBed.get(MasterTableDataSvc);
    expect(Svc).toBeTruthy();
  });
});
