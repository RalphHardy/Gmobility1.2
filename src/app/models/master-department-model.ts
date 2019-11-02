export class MasterDepartmentModel {
    constructor(
        public DeptId: number,
        public DeptName: string,
        public WoTypePrefix: string,
        public PriorityCode: number
    ) {}
}
