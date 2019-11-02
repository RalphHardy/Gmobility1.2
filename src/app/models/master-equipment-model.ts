export class MasterEquipmentModel {
    constructor(
        public EquipId: number,
        public EquipNum: string,
        public Level: number,
        public ShortDesc: string,
        public Description: string,
        public ParentId: number,
        public HierarchyString: string,
        public CDFlag: string
    ) {}
}