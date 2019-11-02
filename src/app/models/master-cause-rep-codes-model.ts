export class MasterCauseCodesModel {
    constructor(
        public CauseCode: string,
        public CauseDesc: string,
        public CauseLongDesc: string
    ) {}
}
//"CauseCode":"BR","CauseDesc":"Broken","CauseLongDesc":"Broken Part or Equipment"},
export class MasterRepairCodesModel {
    constructor(
        public RepairCode: string,
        public RepairDesc: string,
        public RepairLongDesc: string
    ) {}
}
// {"RepairCode":"RE","RepairDesc":"Repaired","RepairLongDesc":"Repaired Part or Equipment"},
export class MasterSymptomCodesModel {
    constructor(
        public SymptomCode: string,
        public SymptomDesc: string,
        public SymptomLongDesc: string
    ) {}
}
//{"SymptomCode":"LK","SymptomDesc":"Leaking","SymptomLongDesc":"Leaking"}