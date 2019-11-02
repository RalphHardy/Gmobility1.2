export class MasterEmployeeModel {
  constructor(
    public EmpNumber: string,
    public EmpName: string,
    public EmpTitle: string,
    public EmpOffice: string,
    public EmpSupervisor: string,
    public EmpWorkPhone: string,
    public TradeId: number,
    public EmpId: number,
    CDFlag: string
  ){}
}

export class EmployeeSearchModel {
  constructor(
      public EmpNum: string,
      public EmpName: string,
      public EmpId: number
  ) {}
}
