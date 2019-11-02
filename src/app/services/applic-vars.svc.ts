import { Injectable } from '@angular/core';
//import 'rxjs/add/operator/map';
import { Http } from '@angular/http';
import { tap, map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Storage } from '@ionic/storage';
import { DeviceDataModel } from '../models/device-data-model';

//Data Models
import { SiteAccessInfo, AppVarsModel, LoginResultsModel, LogoutResultsModel, SiteConfig } from '../models/app-vars-model';

//Services
import { UtilitiesSvc } from '../services/utilities.svc';
import { ConnectionSvc } from '../services/connection.svc';
import { HttpRequestsService } from '../services/http-requests.service';
import { LsoRequestsService } from '../services/lso-requests.service';
import { FirebaseSvc } from '../services/firebase-svc';
import { LoginService } from '../pages/login/login.service';

//Data
import { environment } from '../../environments/environment';
import { delay } from 'q';
import { isNumber } from 'util';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Injectable({
  providedIn: 'root'
})
export class ApplicVarsSvc {

  constructor(
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private storage: Storage,
    private loginSubSvc: LoginService,
    private firebaseSvc: FirebaseSvc
  ) { 

  }
  public catastrophicError = false;
  public catastrophicErrorMsg = "";

  // Labels are set in ... TBD
  public lbl_Repair = "Action";
  public lbl_Wip = "Work in process";

  /* NOTES
  * need to handle the following cases:
  * 1. more than one user on the device
  * 2. more than one database used by a user on the device
  * Therefore:
  * 1. Any LSOs (Local Storage Objects) whose data is only user-dependent will be 
  *     be prefixed by the UserId (e.g., 454-applicVars)
  * 2. Any database MASTER tables will be suffixed by the DbName
  *     (e.g., Catalog-EntMobSync)
  * 3. The selected set of workorders will be prefixed by the UserId AND suffixed by the DbName
  *     (e.g., 454-workorders-RidClfSync)
  * 3. The only LSOs whose name is neither prefixed or suffixed is  "deviceData" and "siteAcessInfo"
  */


  /****************************************
   * THIS SECTION DEALS WITH SITE ACCESS INFO
   ****************************************/
  createInstanceSiteAccessInfo() {
    const siteConfig = new SiteConfig();
    siteConfig.emptyMasterTables = [];
    siteConfig.serverTestTimeout = 10;
    return new SiteAccessInfo('', '', '', '' ,'',
    siteConfig, [],[],'', 0, 0, 0,  '', '', '');    
  }
  public siteAccessInfo = this.createInstanceSiteAccessInfo();


/*** SAVE & RETRIEVE SITE ACCESS INFO TO/FROM LOCAL STORAGE */

storeSiteAccessInfoInLSO(siteAccessInfo: SiteAccessInfo) {
  return this.storage.ready()
  .then (ready => this.storage.remove('siteAccessInfo')) // clear out any old data stored for keyStr 
    .then ((data) => this.storage.set('siteAccessInfo', siteAccessInfo)
      .then((data)=>{
        this.utilitiesSvc.copyPropertiesObj2Obj(siteAccessInfo, this.siteAccessInfo);
        //console.log('***DATA STORED FOR makeSiteAccessInfoKey(SiteCode) ==>', siteAccessInfo);
      }));
}

getFirebaseAccessSiteInfo() {

  if (this.connectionSvc.deviceIsOnline()) {
    
    this.firebaseSvc.readSiteAccessInfo(this.siteAccessInfo.siteAbbrevName, this.siteAccessInfo.siteKeyCode)
    .then (res => {
      this.utilitiesSvc.copyPropertiesObj2Obj(this.firebaseSvc.FbSiteAccessData, this.siteAccessInfo);
        this.httpRequestsSvc.setSiteServerUrl(this.siteAccessInfo.siteServerUrl); // sets httpRequestsSvc.siteServerUrl
        this.lsoRequestsSvc.setSyncDbName(this.siteAccessInfo.siteSyncDbName);
        //handle any changes to the SiteConfig property...
        //"siteConfig": {"emptyMasterTables": ["Locations"]} ...
        
        this.loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);
        //this.utilitiesSvc.debugAlert(false, 'Site Access Data from SERVER -->', JSON.stringify(this.siteAccessInfo) );
      
    },
    (error) => alert('Unable to read Site Access Code & Key')
    )
  }   
}

getServerAccessSiteInfo() {
  alert('** WARNING: getServerAccessSiteInfo is superceded by getFirebaseAccessSiteInfo');
  if (this.httpRequestsSvc.connected2Server) {
    this.httpRequestsSvc.getSiteServerConnectionData(this.siteAccessInfo.siteAbbrevName, this.siteAccessInfo.siteKeyCode)
    .subscribe(
    (data) => {  
      if (data !== null) {
        if (this.utilitiesSvc.debugIssue('1906-20')) console.log('getServerAccessSiteInfo(): Sent request to Server for SiteAccessInfo -->', data); 
  
        this.utilitiesSvc.copyPropertiesObj2Obj(data, this.siteAccessInfo);
        this.httpRequestsSvc.setSiteServerUrl(this.siteAccessInfo.siteServerUrl); // sets httpRequestsSvc.siteServerUrl
        this.lsoRequestsSvc.setSyncDbName(this.siteAccessInfo.siteSyncDbName);
        //handle any changes to the SiteConfig property...
        //"siteConfig": {"emptyMasterTables": ["Locations"]} ...
        
        this.loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);
        //this.utilitiesSvc.debugAlert(false, 'Site Access Data from SERVER -->', JSON.stringify(this.siteAccessInfo) );
      }
    },
    (error) => alert('HTTP Error: '+error.status+' trying to reach '+error.url) 
    )
  }   
}

clearLocalStorage(connected2Server: boolean) {
  const delayMS = 1200;

  this.storage.clear()
  .then (()=> {
    if (this.utilitiesSvc.debugIssue('1906-20')) console.log('clearLocalStorage add - deviceData', this.deviceData);
    this.lsoRequestsSvc.localStorageTables.length = 0;
    this.lsoRequestsSvc.storeDataInLocalStorage(this.deviceData, 
        this.lsoRequestsSvc.deviceDataLSOname);   
    setTimeout( ()=>
    {
      if (this.utilitiesSvc.debugIssue('1906-20')) console.log('clearLocalStorage  add - siteAccessInfo', this.siteAccessInfo);
      this.lsoRequestsSvc.storeDataInLocalStorage(this.siteAccessInfo, 
          this.lsoRequestsSvc.siteAccessInfoLSOname);
      setTimeout(() => {
        if (this.utilitiesSvc.debugIssue('1906-20')) console.log('clearLocalStorage  add - appVarsData', this.appVarsData);
        this.lsoRequestsSvc.storeDataInLocalStorage(this.appVarsData, 
          this.lsoRequestsSvc.applicVarsLSOname); 
        //
        // now continue ...
        setTimeout(() => {          
          if (this.connectionSvc.deviceIsOnline()) this.getFirebaseAccessSiteInfo()
          else this.loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);
        }, delayMS);
      }, delayMS);
    }, delayMS) 
  })
}

setSiteAccessInfo(connected2Server: boolean) {
  //** NO LONGER IN USER --> PORTED TO LOGIN.TS 2019-08-17 */
  /* Flow:
    1. Retrieve SiteAccessInfo
      If SiteAccessInfo==null goto NoDataFound
    2. Retrieve deviceData from LSO --> loginUserId, prevAppVersion //apiDefaultRootUrl
      If deviceData==null goto NoDataFound
    3. Using deviceData.loginUserId Retrieve applicVarsdata
      If deviceData==null goto NoDataFound
  */
  let need2ClearLS = false;

  //---------------------------------
  // #1  Retrieve SiteAccessInfo
  this.lsoRequestsSvc.getDataFromLocalStorage('siteAccessInfo')
  .then ((siteData)=> {    
    let failed2RetrieveSiteAccessInfo = (siteData === null);
    if (!failed2RetrieveSiteAccessInfo) { // Retrieved SiteAccessInfo
      this.utilitiesSvc.copyPropertiesObj2Obj(siteData, this.siteAccessInfo);
      console.log( '#1 LSO Site Access Info -->', siteData, this.siteAccessInfo); 
      this.lsoRequestsSvc.setSyncDbName(this.siteAccessInfo.siteSyncDbName);
      //const siteCode = this.siteAccessInfo.siteAbbrevName;
      //const siteKey = this.siteAccessInfo.siteKeyCode;
      this.httpRequestsSvc.setSiteServerUrl(this.siteAccessInfo.siteServerUrl); // sets httpRequestsSvc.siteServerUrl
      this.lsoRequestsSvc.setSyncDbName(this.siteAccessInfo.siteSyncDbName);

      //---------------------------------
      // #2  Retrieve deviceData
      this.lsoRequestsSvc.getDataFromLocalStorage('deviceData')
      .then ((devData)=> {  
        let failed2RetrieveSDeviceData = (devData == null);
        if (!failed2RetrieveSDeviceData) { // Retrieved SiteAccessInfo
          this.utilitiesSvc.copyPropertiesObj2Obj(devData, this.deviceData);
          console.log('#2 LSO deviceData =>', devData, this.deviceData );

          //---------------------------------
          // #3  Retrieve applicVarData
          this.lsoRequestsSvc.setLSOnames(devData.loginUserId);
          this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.applicVarsLSOname)
          .then ((applicData)=> {  
            let failed2RetrieveApplicVarsData = (applicData === null);
            if (!failed2RetrieveApplicVarsData) { // Retrieved SiteAccessInfo
              this.utilitiesSvc.copyPropertiesObj2Obj(applicData, this.appVarsData);
              console.log('#3 LSO appVarsData =>', this.appVarsData) ;

              // Now do final processing after successfully retrieving the Admin LSOs...
              let prevAppVersion = "";
              if (this.deviceData.prevAppVersion !== "") prevAppVersion = this.deviceData.prevAppVersion 
              else prevAppVersion = "1.0.0.0";
              if (this.utilitiesSvc.cmpVersion3rdElement(environment.AppVersion, prevAppVersion)) {
                alert('New app version '+environment.AppVersion+' (prev '+prevAppVersion+') requires refresh to local data');
                this.clearLocalStorage(connected2Server);
              } 
              else {
                //if (connected2Server) this.getServerAccessSiteInfo()
                //if (this.connectionSvc.deviceIsOnline()) this.getFirebaseAccessSiteInfo() else 
                this.loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo); 
                
              }   
              let failed2RetrieveSiteAccessInfo = false;
              let failed2RetrieveSDeviceData = false;
              let failed2RetrieveAdminData = false; 
            } 
          } // Retrieved applicVarData
          ) // (applicData)
          .catch(err=>{ this.catastrophicError=true; this.catastrophicErrorMsg='Failed to read LSO: '+this.lsoRequestsSvc.applicVarsLSOname } )         
        } 
      } // Retrieved devData
      ) // (devData)
      .catch(err=>{ this.catastrophicError=true; this.catastrophicErrorMsg='Failed to read LSO: '+this.lsoRequestsSvc.deviceDataLSOname } )
    } // Retrieved SiteAccessInfo

    else { // no SiteAccessInfo found :()
      // note: the subscription that executes will deal with no SiteAccessInfo found
      this.loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);
    }   
  } ) // (siteData)
  .catch(err=>{ this.catastrophicError=true; this.catastrophicErrorMsg='Failed to read LSO: '+this.lsoRequestsSvc.siteAccessInfoLSOname } )

}

  /****************************************
   * NEW SECTION DEALS WITH USER-DATABASE-DATA
   ****************************************/

setPrimaryOfflineWoSeqNum(setValue: number) {
  this.appVarsData.primaryOfflineWoSeqNum = setValue;
  this.lsoRequestsSvc.storeDataInLocalStorage(this.appVarsData, this.lsoRequestsSvc.applicVarsLSOname);
}

incrementOffLineSeqNum() {
  const seqNum = this.appVarsData.primaryOfflineWoSeqNum + 1;
  if (this.utilitiesSvc.debugIssue('1906-20')) console.log('--> incrementOffLineSeqNum, new Seq No. is: ', seqNum);
  this.setPrimaryOfflineWoSeqNum(seqNum);
}

getPrimaryOfflineWoSeqNum(): number {
  return this.appVarsData.primaryOfflineWoSeqNum;
}


  /****************************************
   * FIRST SECTION DEALS WITH DEVICE-DATA
   * * device contains (a) USER_ID used to access <userId>-applicVars storage data
   * * and (b) info that pertains to any users using the application on the device
   ****************************************/

  public deviceData = new DeviceDataModel
  (0,'', '','','',[], []); // loginUserId


/*** Utility Functions to return data from device settings ***/

/*** SAVE & RETRIEVE APP VARS TO/FROM LOCAL STORAGE */

getDevice_ApplicDataFromLocalStorage() {
  return this.storage.ready()
   .then (ready => this.storage.get('deviceData') // now get 
   .then (devData => this.storage.get(devData.loginUserId.toString()+"-applicVars")
      .then(appData => {
            if (appData !== null ) {
              this.utilitiesSvc.copyPropertiesObj2Obj(devData, this.deviceData);
              this.utilitiesSvc.copyPropertiesObj2Obj(appData, this.appVarsData);
              //this.httpRequestsSvc.setSiteServerUrl(this.appVarsData.apiRootUrl);
              this.utilitiesSvc.debugAlert(false,'** DEVICE DATA LOADED FROM LOCAL -->', JSON.stringify(this.deviceData) );
              this.lsoRequestsSvc.setLSOnames(devData.loginUserId); // uses the UserId set in deviceData
              this.utilitiesSvc.debugAlert(false,'** APP VARS LOADED FROM LOCAL (1) -->', JSON.stringify(this.appVarsData));
              }     
            } // then(appData => 
          )
          ).catch(err => alert('ERROR: UNABLE to load from offline storage for applicVars'+JSON.stringify(err) )
      )
      ).catch(err => alert('ERROR: UNABLE to load from offline storage for deviceData'+JSON.stringify(err) ) 
      );     
}

setLoginUserId(setValue: number) {
  this.deviceData.loginUserId = setValue;
  this.appVarsData.loginUserId = setValue;
  //console.log('setLoginUserId -->', setValue);
}

getLoginUserId() {
  return this.deviceData.loginUserId;
}

// #10
setLogOutDate(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = ''}
  this.appVarsData.logOutDate = setValue;
}
getLogOutDate() {
  return this.appVarsData.logOutDate;
}
// #11
setLogOutTime(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = "00:00" }
  this.appVarsData.logOutTime = setValue;
}
getLogOutTime() {
  return this.appVarsData.logOutTime;
}

//------------------------------------------------------------//


// #12
setApiLastUsedRootUrl(setValue: string) {
  this.deviceData.apiLastUsedRootUrl = setValue;
}

getApiLastUsedRootUrl(): string {
  return this.deviceData.apiLastUsedRootUrl;
}

// #13
setApiDefaultRootUrl(setValue: string) {
  this.deviceData.apiDefaultRootUrl = setValue;
}

getApiDefaultRootUrl(): string {
  return this.deviceData.apiDefaultRootUrl;
}

// #14
setLastServerSyncDateTime(setValue: string) {
  this.deviceData.lastServerSyncDateTime = setValue;
}

getLastServerSyncDateTime(): string {
  return this.deviceData.lastServerSyncDateTime;
}

//------------------------------------------------------------//


// #18



  /****************************************
   * SECOND SECTION DEALS WITH USER APPLICATION DATA
   ****************************************/

public appVarsData = new AppVarsModel
  ('', '', '', '' ,'',
    0, 0, '', '', '', 
    0, '', '', false, false, 
    '', '', false, '', '', 0, {timeCardRounding: 0, timeCardRoundUp: true}); 


/*
		public loginDate:any,
		public loginTime:any,
		public loginName:string,
		public loginPassword:string,
		public UserFullName: string, //5 

		public loginUserId: number, //User ID (no.) from Enterprise System
		public mobDevUserId:number, // This is the IDENTITY of the record which associates Device and User
		public lastLoginDate:string, 
		public lastLoginTime:string, 
		public lastLoginName:string, //10

		public lastLoginDevMobUserId:number,
		public logOutDate:string,
		public logOutTime:string,
		public onlyUseLocalData:boolean, 
		public developerSession:boolean, //15

		public apiRootUrl: string,
		public apiToken: string,
		public currLoginValid: boolean,
		public primaryOfflineWoSeqNum: number,
		public userEmpNum: number //20
*/



/*** SAVE & RETRIEVE APP VARS TO/FROM LOCAL STORAGE */
storeAppVarsInLocalStorage() {
  return this.storage.ready()
  .then (ready => this.storage.remove(this.lsoRequestsSvc.applicVarsLSOname) // clear out any old data stored for keyStr 
    .then ((data) => this.storage.set(this.lsoRequestsSvc.applicVarsLSOname, this.appVarsData)
      .then((data)=>{
        this.utilitiesSvc.debugAlert(false,'***DATA STORED FOR applicVars ==>', JSON.stringify(this.appVarsData) );
      })));
}

getApplicVarsFromLocalStorage() {
  return this.storage.ready()
   .then (ready => this.storage.get(this.lsoRequestsSvc.applicVarsLSOname)
      .then(data => {
            if (data !== null ) {
              this.appVarsData = data;
              this.utilitiesSvc.debugAlert(false,'** APP VARS LOADED FROM LOCAL (2) -->', this.lsoRequestsSvc.applicVarsLSOname+JSON.stringify(this.appVarsData) );
              }     
            } // then(data => 
          )
          ).catch(err => { if (debugMode) 
                alert('ERROR: UNABLE to load from offline storage for applicVars->'+ JSON.stringify(err) ) }
      );     
}

// #1
setLoginDate(setValue: string) {
  this.appVarsData.loginDate = setValue;
}
getLoginDate(): string {
  return this.appVarsData.loginDate;
}
// #2
setLoginTime(setValue: string) {
  let beforeValue = this.appVarsData.loginTime;
  this.appVarsData.loginTime = setValue;
}
getLoginTime(): string {
  return this.appVarsData.loginTime;
}
// #3
setLoginName(setValue: string) {
  let beforeValue = this.appVarsData.loginName;
  this.appVarsData.loginName = setValue;
}
getLoginName() {
  return this.appVarsData.loginName;
}
// #4
setLoginPassword(setValue: string) {
  this.appVarsData.loginPassword = setValue;
}
getLoginPassword() {
  return this.appVarsData.loginPassword;
}
// #5
setUserFullName(setValue: string) {
  let beforeValue = this.appVarsData.userFullName;
  this.appVarsData.userFullName = setValue;
}
getUserFullName() {
  return this.appVarsData.userFullName;
}
// #6

// #7
setMobDevUserId(setValue: number) {
  if (!setValue || !isNumber(setValue) || (!isNumber(setValue) && setValue<=0)) {
    alert('Error: please advise G-Mobility support that the Mobile-Device-User-Id is not set properly.');
  }
  else 
    this.appVarsData.mobDevUserId = setValue;
}
getMobDevUserId() {
  const mobDevUserId = this.appVarsData.mobDevUserId; 
  if (!mobDevUserId || !isNumber(mobDevUserId) || (!isNumber(mobDevUserId) && mobDevUserId<=0))
    alert('Error: please advise G-Mobility support that the Mobile-Device-User-Id is not set properly.');
  return mobDevUserId;
}

//------------------------------------------------------------//
// #8
setLastLoginDate(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = "00/00/1900" }
  let beforeValue = this.appVarsData.lastLoginDate;
  this.appVarsData.lastLoginDate = setValue;
}
getLastLoginDate() {
  return this.appVarsData.lastLoginDate;
}
// #9
setLastLoginTime(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = "00:00" }
  let beforeValue = this.appVarsData.lastLoginTime;
  this.appVarsData.lastLoginTime = setValue;
}
getLastLoginTime() {
  return this.appVarsData.lastLoginTime;
}
// #10
setLastLoginName(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = "Not prev logged in" }
  let beforeValue = this.appVarsData.lastLoginName;
  this.appVarsData.lastLoginName = setValue;
}
getLastLoginName() {
  return this.appVarsData.lastLoginName;
}
// #11
setLastMobDevUserId(setValue: number) {
  if (typeof(setValue) == "undefined") { setValue = 0 }
  let beforeValue = this.appVarsData.lastLoginDevMobUserId;
  this.appVarsData.lastLoginDevMobUserId = setValue;
}
getLastMobDevUserId() {
  return this.appVarsData.lastLoginDevMobUserId;
}

//------------------------------------------------------------//
// #12
setlogOutDate(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = ''}
  let beforeValue = this.appVarsData.logOutDate;
  this.appVarsData.logOutDate = setValue;
}
getlogOutDate() {
  return this.appVarsData.logOutDate;
}
// #13
setlogOutTime(setValue: string) {
  if (typeof(setValue) == "undefined") { setValue = "00:00" }
  let beforeValue = this.appVarsData.logOutTime;
  this.appVarsData.logOutTime = setValue;
}
getlogOutTime() {
  return this.appVarsData.logOutTime;
}

// #15
 setDeveloperSession(setValue: boolean) {
  let beforeValue = this.appVarsData.developerSession;
  this.appVarsData.developerSession = setValue;
 }

 getDeveloperSession(): boolean {
  //console.log('getDeveloperSession',this.appVarsData.developerSession);
   return this.appVarsData.developerSession;
}

// #16
setApiRootUrl(setValue: string) {
  //this.httpRequestsSvc.setSiteServerUrl(setValue);
  this.appVarsData.apiRootUrl = setValue;
}

getApiRootUrl(): string {
  return this.appVarsData.apiRootUrl;
}

// #17
setApiToken(setValue: string) {
  this.httpRequestsSvc.setBearerToken(setValue);
  this.appVarsData.apiToken = setValue;
}

getApiToken(): string {
  return this.appVarsData.apiToken;
}

// #18
setCurrLoginValid(setValue: boolean) {
  //console.log('SETTING: currLoginValid: ', setValue);
  this.appVarsData.currLoginValid = setValue;
  this.connectionSvc.chgLoginState(setValue);
}
getCurrLoginValid(): boolean {
  //console.log('CHECKING: currLoginValid: ', this.appVarsData.currLoginValid);
  return this.appVarsData.currLoginValid;
}


// #19

setCurrDbName(setValue: string) {
  this.appVarsData.currDbName = this.siteAccessInfo.siteSyncDbName;
}

getCurrDbName(): string {
  return this.siteAccessInfo.siteSyncDbName;
}

// 
SetTimeCardRounding(setValue: number) {
  let beforeValue = this.appVarsData.appSettings.timeCardRounding;
  this.appVarsData.appSettings.timeCardRounding = setValue;
  if (this.appVarsData.developerSession) {
    //console.log('setuserEmpNum - from: ',beforeValue, ' to:',this.appVarsData.userEmpNum);
  }
}
getTimeCardRounding(): number {
  //return this.appVarsData.timeCardRounding;
//console.log('appvars = ', this.appVarsData);
  if (!this.appVarsData.appSettings)
    this.appVarsData.appSettings={timeCardRounding: 0, timeCardRoundUp: true};
  return this.appVarsData.appSettings.timeCardRounding;
}

// 
setTimeCardRoundUp(setValue: boolean) {
  let beforeValue = this.appVarsData.appSettings.timeCardRoundUp;
  this.appVarsData.appSettings.timeCardRoundUp = setValue;
  if (this.appVarsData.developerSession) {
    //console.log('setuserEmpNum - from: ',beforeValue, ' to:',this.appVarsData.userEmpNum);
  }
}
getTimeCardRoundUp(): boolean {
  //return this.appVarsData.timeCardRounding;
  //console.log('appvars = ', this.appVarsData);
  if (!this.appVarsData.appSettings)
    this.appVarsData.appSettings={timeCardRounding: 0, timeCardRoundUp: true};
  return this.appVarsData.appSettings.timeCardRoundUp;
}

setUserEmpNum(setValue: string) {
  let beforeValue = this.appVarsData.userEmpNum;
  this.appVarsData.userEmpNum = setValue;
  if (this.appVarsData.developerSession) {
    //console.log('setuserEmpNum - from: ',beforeValue, ' to:',this.appVarsData.userEmpNum);
  }
}
getUserEmpNum(): string {
  return this.appVarsData.userEmpNum;
}

chkAppVersion(): boolean {
  // true if V2 >= V1
  //console.log('chkAppVersion', this.siteAccessInfo.minAppRevision, environment.AppVersion);
  return this.utilitiesSvc.cmpVersionStrings(this.siteAccessInfo.minAppRevision, environment.AppVersion);
  // 1.1.0.0 vs 1.2.3.2
}
   
saveLoginResults(loginResult: LoginResultsModel, loginName, password) {
  // save User ID to LSO="deviceData"
  //console.log('##2-01 applic-vars  saveLoginResults ->',loginResult); 
  this.deviceData.loginUserId = loginResult.CurrentUserId;
  this.deviceData.prevAppVersion = environment.AppVersion;
  this.lsoRequestsSvc.storeDataInLocalStorage(this.deviceData, this.lsoRequestsSvc.deviceDataLSOname);
  
  this.connectionSvc.chgLoginState(true);
  this.lsoRequestsSvc.setLSOnames(loginResult.CurrentUserId);

  // save previous login information ...
  this.setLastLoginDate(this.getLoginDate());
  this.setLastLoginTime(this.getLoginTime());
  this.setLastLoginName(this.getLoginName()); 
  this.setLastMobDevUserId(this.getMobDevUserId()); // save previous
  // save current login info ...
  this.setLoginName(loginName);
  this.setLoginPassword(password);
  this.setUserFullName(loginResult.CurrentUserName);
  this.setLoginUserId(loginResult.CurrentUserId);
  this.setUserEmpNum(loginResult.UserEmpNum);
  this.setMobDevUserId(loginResult.CurrentMobDevUserId);
  this.setApiToken(loginResult.SecToken);
  this.setApiRootUrl(this.httpRequestsSvc.getSiteServerUrl());
  this.setCurrDbName(this.siteAccessInfo.siteSyncDbName);

  this.lsoRequestsSvc.setLSOnames(this.getLoginUserId());
  this.lsoRequestsSvc.setSyncDbName(this.getCurrDbName());
  this.httpRequestsSvc.setSiteServerUrl(this.getApiRootUrl());
  this.httpRequestsSvc.setBearerToken(loginResult.SecToken);

  const currDate = new Date();
  this.setLoginTime(this.utilitiesSvc.getSmallTimeStr(currDate));
  this.setLoginDate(this.utilitiesSvc.getSmallDateStr(currDate));

  // set offlineWOseqnum --> ALSO saves applicVarsData to LSO
  this.setPrimaryOfflineWoSeqNum(loginResult.PrimaryOfflineWoSeqNum);
  this.storeAppVarsInLocalStorage();
}
  
saveLogoutResults(logoutResult: LogoutResultsModel) {
  if  ( (!logoutResult.ServerLogoff) // not online when logged off
      || (logoutResult.ErrorNum ===0 && this.getLoginUserId() == logoutResult.CurrentUserId)  ) {
    const currDate = new Date();
    this.setlogOutTime(this.utilitiesSvc.getSmallTimeStr(currDate));
    this.setLogOutDate(this.utilitiesSvc.getSmallDateStr(currDate));

    this.lsoRequestsSvc.storeDataInLocalStorage(this.appVarsData, this.lsoRequestsSvc.applicVarsLSOname);
  }
}

/* sample to copy & paste ...
// #17
 setXYZ(setValue: string) {
   let beforeValue = this.appVarsData.XYZ;
   this.appVarsData.XYZ = setValue;
   if (this.appVarsData.developerSession) {
     //console.log('setXYZ - from: ',beforeValue, ' to:',this.appVarsData.XYZ);}
 }
 getXYZ(): string {
   return this.appVarsData.XYZ;
 }
*/

}
