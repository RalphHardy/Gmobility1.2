import { WoActualTimeModel } from '../models/wo-actual-time-model';

export class WoLaborLineModel {
    constructor(
        //public WoLaborRecId: number, --removed 2018-06; will use MobLineId instead
        public WoNumber: string,
        public TradeId: number,
        public TradeDesc: string,
        public Description: string, 
        public EstTime: number, // 5
        public AccumTime: number,
        public StepSeqNum: number,
        public StartDateTime: string,
        public CompletedDateTime: string, 
        // public EmpID: number, --removed 2018-06
        public EmpNum: string, //10
        public EmpName: string, 
        public WoActualTimeLines: WoActualTimeModel[],
        public MobLineId: number,
        public MobDispSeq: string,
        public RecLocked: boolean //15
    ) {};
}

export class WoLaborAddEditModel {
    constructor(
        public WoNumber: string,
        public TradeId: number,
        public TradeDesc: string, // Labor/work description
        public Description: string, 
        public EstTime: number, // 5
        public EmpNum: string,
        public EmpName: string, 
        public MobLineId: number,
        public MobDispSeq: string,
        public StartDateTime: string, //10
        public CompletedDateTime: string
    ) {};
}
