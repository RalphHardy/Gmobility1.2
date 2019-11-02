export class AppVarsModel{
    constructor(
		public loginDate:any,
		public loginTime:any,
		public loginName:string,
		public loginPassword:string,
		public userFullName: string, //5 

		public loginUserId: number, //User ID (No.) from Enterprise System
		public mobDevUserId:number, // This is the IDENTITY of the record which associates Device and User
		public lastLoginDate:string, 
		public lastLoginTime:string, 
		public lastLoginName:string, //10

		public lastLoginDevMobUserId:number, // REMOVE???
		public logOutDate:string,
		public logOutTime:string,
		public onlyUseLocalData:boolean, 
		public developerSession:boolean, //15

		public apiRootUrl: string,
		public apiToken: string,
		public currLoginValid: boolean,
		public currDbName: string,
		public userEmpNum: string, //20
		public primaryOfflineWoSeqNum: number,
		public appSettings: AppSettings

	) {}
}

export class LoginResultsModel {
	constructor(
		public ErrorNum: number,
		public CurrentUserName: string,
		public CurrentUserId: number,
		public CurrentMobDevUserId: number,
		public UserEmpNum: string,
		public LastLoggedIn: string,
		public LastLoggedOut: string,
		public PrimaryOfflineWoSeqNum: number,
		public CurrNumUsersLoggedIn: number,
		public SecToken: string

	) {}
}

export class LogoutResultsModel {
	constructor(
		public ErrorNum: number,
		public CurrentUserName: string,
		public CurrentUserId: number,
		public LastLoggedIn: string,
		public LastLoggedOut: string,
		public ServerLogoff: boolean
	) {}
}

export class SiteAccessInfo { // stored in LocalStorage as <UserId>"-"SiteAccessInfo"-"<SiteNameCode
	constructor(
		public siteAbbrevName: string,
		public siteName: string, 
		public siteKeyCode: string,
		public siteServerUrl: string,
		public siteSyncDbName: string,
		public siteConfig:  SiteConfig,
		public labelNames:  Array<string>,
		public labelValues:  Array<string>,

		public minAppRevision: string, // if app is lower, then alert user and exit application
		public maxActiveUsers: number,
		public numAdditionalUsers: number,
		public siteStatusId: number, // 0=inactive, 1=active, 2=demo-license
		public dateActivated: string,
		public licenseEndingDate: string,
		public dateDeactivated: string
	) {}
} 
export class SiteConfig {
	emptyMasterTables: Array<string>;
	serverTestTimeout: number;
}

export class AppSettings {
	public timeCardRounding: number;
	public timeCardRoundUp: boolean;
}

export function CreateSiteAccessObject(): SiteAccessInfo {
    return {
      siteAbbrevName: '',
      siteName: '' ,
      siteKeyCode: '',
      siteServerUrl: '',
      siteSyncDbName: '',
      siteConfig:  {emptyMasterTables: [], serverTestTimeout: 0},
      labelNames: [],
      labelValues:  [],
  
      minAppRevision: '', // if app is lower, then alert user and exit application
      maxActiveUsers: 0,
      numAdditionalUsers: 0,
      siteStatusId: 0, // 0=inactive, 1=active, 2=demo-license
      dateActivated: '',
      licenseEndingDate: '',
      dateDeactivated: ''
    }
  }

/*

	{
	  "siteAbbrevName": "RALPHTESTRC",
	  "siteName": "Gmobility Test Ridley-Clifford",
	  "siteKeyCode": "R1H2",
	  "siteServerUrl": "http://remote1.circlegsoftware.com/api/",
	  "siteSyncDbName": "TestRcSync",
	  "siteConfig": {"emptyMasterTables": ["Locations"], "serverTestTimeout": 10},
	  "labelNames": [""],
	  "labelValues": [""],
	  
	  "minAppRevision": "1.0.0",
	  "siteStatusId": 1,
	  "dateActivated": "2018-01-01",
	  "licenseEndingDate": "2019-12-31",
	  "dateDeactivated": ""
	},
*/
