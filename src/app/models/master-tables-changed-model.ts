export class MasterTablesChangedModel {
    constructor(
            public TableName: string,
            public NumRows: number,
            public LastUpdateTime: string
    ) {}
}