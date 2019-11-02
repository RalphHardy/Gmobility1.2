export class WoMaterialLineModel {
    constructor(
        public SkuCode: string,
        public SkuDescription: string,
        public SkuCategory: string,
        public EstQty: number,
        public ActualQty: number, // this will be the Qty Issued by the Guardian system

        public QtyPickedUp: number,
        public QtyUsed: number,
        public Source: string,
        public AcquisitionMethodCode: string, // varchar(1) added 2018-09-19
        public AcquisitionMethodDesc: string,  //10  // added 2018-09-19
        
        public AcquisitionInfo: string, // added 2018-09-19
        public SupplierCode: string, 
        public SupplierName: string, 
        public Warehouse: string,
        public Bin: string, //15

        public StagingLocation: string,         
        public UsageDate: string, 
        public EmpNum: string, 
        public EmpName: string,
        public PurchPrice: number,  // 20 // required for non-p.o. purchases (AcquisitionMethodCode = [3,4,5])

        public UnitOfMeasure: string,
        public MobLineId: number,
        public MobDispSeq: string,
        public RecLocked: boolean,
        public EntMatLineId: number // 25
    ) {}
}
export class MatLineAcqDataModel {
    constructor(
        public SkuCode: string, // READ-ONLY
        public Source: string, // READ-ONLY
        public AcquisitionMethodCode: string, // varchar(1) added 2018-09-19
        public AcquisitionMethodDesc: string,  //10  // added 2018-09-19        
        public AcquisitionInfo: string, // added 2018-09-19

        public SupplierCode: string, 
        public SupplierName: string, 
        public UsageDate: string, 
        public EmpNum: string, 
        public EmpName: string,//10
        
        public PurchPrice: number,  // required for non-p.o. purchases (AcquisitionMethodCode = [3,4,5])
        public UnitOfMeasure: string
    ) {}
}