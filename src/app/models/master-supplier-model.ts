export class MasterSupplierModel {
    constructor(
        public SupplierCode: string,
        public SupplierName: string,
        public Address: string,
        public City: string,
        public StateProv: string,
        public MainPhone: string,
        public MobilePhone: string,
        public ContactName: string,
        public Terms: string,
        public CDFlag: string
    ) {}
}