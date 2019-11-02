export class genericDropdownElModel {
    constructor(
        public elId: string,
        public elDesc: string
    ) {}
}

export class ChangedTables { // captures result of API GET ListChangedTables
    constructor(
    TableName: string,
    NumRows: number,
    LastUpdateTime: string
) {}
}

export class TableMaintenanceModel {
    constructor(
        public lastReloadedInfo: LastReloadedInfo[]
    ) {}
}


export class LastReloadedInfo {
    constructor(
        public tableName: string,
        public versionNum: string,
        public reLoadDate: string 
    ) {}
}
 