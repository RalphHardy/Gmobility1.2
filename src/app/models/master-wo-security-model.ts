export class MasterWoSecurityModel {
    constructor(
        public UserSecId: number,
        public PolicyName: string, // either 'WOEDIT' or 'WONEW'
        public WoTypeCode: string 
    ) {}
}