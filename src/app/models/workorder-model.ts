import { WoLaborLineModel } from '../models/wo-labor-line-model';
import { WoMaterialLineModel } from '../models/wo-material-line-model';
import { WoNoteModel } from '../models/wo-note-model';
import { WoAttachFilesModel } from '../models/wo-attach-files-model';

export class WorkorderModel {
    constructor(
        public WoNumber: string,
        public WoDesc: string,
        public DirtyFlag: boolean,
        public UrgentFlag: boolean, // new 2019-06-25
        public WoInstructions: string,  // 5
        public EquipNumber: string,
        public EquipDesc: string, 
        public MobDevUserId: number,
        public LoginName: string,
        public LoginFullName: string, //10

        public WoMobStatusId: number, 
        public WoMobStatusDesc: string, 
        public WoSequence: number,
        public PriorityId: number,
        public PriorityDesc: string, //15

        public MachineStateId: number,
        public MachineStateDesc: string, 
        public EquipLocId: number,
        public EquipLocation: string,
        public DateRequired: string, //20

        public RespondedDateTime: string, // new 2019-06-25
        public ReportedDateTime: string, // new 2019-06-25
        public StartDate: string, 

        //public SymptomNote: string, // removed 2019-06-12
        //public CauseNote: string,   // removed 2019-06-12
        //public ActionNote: string,  // removed 2019-06-12
        public CauseCode: string,
        public CauseDesc: string, //25
        public RepairCode: string, 
        public RepairDesc: string,
        public SymptomCode: string,
        public SymptomDesc: string,
        public RequestedBy: string,  //30

        public TradeId: number, 
        public TradeDesc: string,
        public CompletedDate: string,
        public AssignedToUserId: number,
        public AssignedDate: string, //35
        public AssignedByName: string, 
        public ModByName: string,
        public ModifiedDate: string,
        public EnterpriseWoNum: string,
        public RefWoNum: string, //40

        public WoTypeId: number,  
        public WoTypeDesc: string,
        public CreatedDate: string,
        public OrigAssignedTo: number,
        public OrigAssignedToName: string, //45
        public DTAssignmentChanged: string, 
        public MobDispSeq: string, 
        public WoLaborLines: WoLaborLineModel[],
        public WoMaterialLines: WoMaterialLineModel[],
        public WoNotes: WoNoteModel[], //50
        
        public WoAttachFiles: WoAttachFilesModel[]
    ) {}
}

export class WorkorderCreateModel {
    constructor(
        public WoNumber: string,
        public WoDesc: string,
        public WoInstructions: string,

        public EquipNumber: string,
        public EquipDesc: string, //5

        public WoTypeId: number,  
        public WoTypeDesc: string,

        public PriorityId: number,
        public PriorityDesc: string,

        public MachineStateId: number, //10
        public MachineStateDesc: string, //11
        
        public TradeId: number, 
        public TradeDesc: string,


        public DateRequired: string,
        public StartDate: string, //15
        public RespondedDateTime: string, // new 2019-06-25
        public ReportedDateTime: string, // new 2019-06-25

        public RequestedBy: string, 

        public LoginName: string,
        public LoginFullName: string, //20

        public MobDevUserId: number, 
        public WoMobStatusId: number, 
        public WoMobStatusDesc: string,
        public CreatedDate: string,
        public MobDispSeq: string, //25

        public AssignedToUserId: number, 
        public AssignedDate: string, 
        public AssignedByName: string, 
        
        public RefWoNum: string,

        public EmpNum: string, //30
        public EmpName: string, 
        public EstHours: number,
        public WoNote: string,
        public CauseCode: string,
        public CauseDesc: string, //35
        public RepairCode: string, 
        public RepairDesc: string,
        public SymptomCode: string,
        public SymptomDesc: string,
        public UrgentFlag: boolean // new 2019-06-25

    ) {}
}


export class WorkorderEditModel {
    constructor(
        public WoNumber: string, // used for id'g the woNum when passed to updateWorkorder()
        public WoDesc: string,
        public WoInstructions: string,

        public EquipNumber: string,
        public EquipDesc: string, //5

        public PriorityId: number,
        public PriorityDesc: string,

        public MachineStateId: number, 
        public MachineStateDesc: string,
        
        public TradeId: number,  //10
        public TradeDesc: string,

        public WoMobStatusId: number, 
        public WoMobStatusDesc: string,
        public CauseCode: string,
        public CauseDesc: string, //15
        public RepairCode: string, 
        public RepairDesc: string,
        public SymptomCode: string,
        public SymptomDesc: string,
        public UrgentFlag: boolean, //20   new 2019-06-25
        public DateRequired: string,
        public StartDate: string, //
        public RespondedDateTime: string, // new 2019-06-25
        public ReportedDateTime: string, // new 2019-06-25
        public CompletedDate: string
    ) {}
}

    export class WoDatesModel {
        constructor(
        public DateRequired: string,
        public StartDate: string, //
        public RespondedDateTime: string, // new 2019-06-25
        public ReportedDateTime: string, // new 2019-06-25
        public CompletedDate: string
    ) {}
}