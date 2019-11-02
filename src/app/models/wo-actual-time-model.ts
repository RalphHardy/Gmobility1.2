export class WoActualTimeModel {
    constructor(
        public EmpNum: string,
        public EmpName: string,
        public WorkDate: string,
        public StartTime: string, // 5
        public EndTime: string,
        public ElapsedTime: string, 
        public Hours: number,
        public MobLineId: number,
        public MobDispSeq: string, // 10
        public RecLocked: boolean
    ) {}
}

