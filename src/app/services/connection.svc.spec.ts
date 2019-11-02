import { TestBed } from '@angular/core/testing';

import { ConnectionSvc } from './connection.svc';

describe('ConnectionSvc', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const svc: ConnectionSvc = TestBed.get(ConnectionSvc);
    expect(svc).toBeTruthy();
  });
});
