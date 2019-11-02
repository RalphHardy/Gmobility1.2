import { WoAttachFilesModel } from '../models/wo-attach-files-model';

export class WorkRequestModel {
    constructor(
        public Description: string, //** ref: Instructions 
        public EquipNumber: string, //** ref: EquipmentNum [optional]
        public EquipDesc: string, // not used by API
        public EquipLocId: number,
        public EquipLocName: string, // not used by API

        public PriorityId: number, //** note: name diff from Enterprise 
        public WorkReqTypeId: number, 
        public WorkReqTypeDesc: string, // not used by API
        public SymptomCode: string, //** ref: SymptomID
        public SymptomCodeDesc: string, //** not used by API
        public DepartmentId: number, //** ref: DepartmentID
        public DepartmentDesc: string, //** not used by API

        public Note: string, //** ref: WorkRequestNotes table (just add one row)
        public LoginName: string, 
        public LoginFullName: string,
        public SecUserId: number, //** ref: WorkRequestUserID
        public RequestedBy: string, 
        public EmailAddress: string, //** ref: Email
        public AttentionTo: string,  //** ref: Attention

        public CreatedDateTime: string, //** ref: DateTimeEnetered
        public DirtyFlag: boolean, // if True, then not yet sent to server
        public Sent2ServerDateTime: string,
        public WorkReqNum: string, // sent back as a result from the API
        
        public WoAttachFiles: WoAttachFilesModel[]
    ) {}
}
