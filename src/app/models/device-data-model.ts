export class DeviceDataModel{ // data that relates to the device 
    constructor(
		
        public loginUserId: number, //User No. from Enterprise System
        public prevAppVersion: string,
        //--------
        public apiLastUsedRootUrl: string, 
        public apiDefaultRootUrl: string,          
		public lastServerSyncDateTime: string,
        public msgs2Send2Server: ServerMessages[], 
        
        public msgsRcvdFrmServer: ServerMessages[]
	) {}
}

export class ServerMessages {
    constructor(
        public MsgCreatedDateTime: string,
        public MsgRcvdDateTime: string,
        public IsDevMsg: boolean,
        public isMsgRead: boolean,
        public MsgReadDateTime: string,
        public MsgText: string
	) {}
}