export class MasterCatalogModel {
    constructor(
        public SkuCode: string,
        public ItemClass: string,
        public ItemSubClass: string,
        public ItemDesc: string,
        public IsStockItem: boolean, 
        public SupplierCode: string,
        public SupplierName: string,
        public SupplierPartNumber: string,
        public ItemNotes: string,
        public SpecialHandling: string,
        public UnitOfMeasure: string,
        public SkuCategory: string,
        public CatId: number, // req'd for Guardian method of handling Barcodes (e.g., "CC"+<cat_uid>)
        public CDFlag: string
    ) {}
}

export class MasterStockBinLocModel {
    constructor(
        public SkuCode: string,
        public Warehouse: string,
        public BinNum: string,
        public QtyOnHand: number,
        public EntRecUid: number,
        public RecordDeleted: boolean
    ) {}
}

export class CatalogSearchModel {
    constructor(
        public SkuCode: string,
        public ItemClass: string,
        public ItemSubClass: string,
        public ItemDesc: string,
        public SkuCategory: string,
        public CatId: number
    ) {}
}

export class CatalogAltBarcodeModel { // API GET CatalogAltBarcodes
    constructor(
        public CatId: number,// source: EntDb.CatalogBarcodes.CatalogID
        public Barcode: string, // source: EntDb.CatalogBarcodes.Barcode
        public Note: string // source: EntDb.CatalogBarcodes.Notes
    ) {}
}
