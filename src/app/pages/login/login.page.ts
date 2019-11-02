import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalController, NavController, AlertController, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AppMinimize } from '@ionic-native/app-minimize/ngx';
import { Subscription } from 'rxjs';


//Pages
import { SettingsPage } from '../admin/settings/settings.page';
import { SiteCodePage } from '../admin/site-code/site-code.page';

//Services

import { UtilitiesSvc } from '../../services/utilities.svc';
import { HttpRequestsService } from '../../services/http-requests.service';
import { LsoRequestsService } from '../../services/lso-requests.service';
import { LoginService } from './login.service';
import { LoadingService } from '../../services/loading.service';
import { ConnectionSvc } from '../../services/connection.svc';
import { ApplicVarsSvc } from '../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../services/workorder-data.svc';

//Data Models
import { SiteAccessInfo, LoginResultsModel, LogoutResultsModel } from '../../models/app-vars-model';

//Data
import { environment } from '../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode = environment.CurrDevDebug;

//Plugins

import { Storage } from '@ionic/storage'; //**REMOVE */
import { del } from 'selenium-webdriver/http';


/* 3rd PARTY COMPONENTS */
//import { DatePickerModule } from 'ion-datepicker';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})

export class LoginPage implements OnInit, OnDestroy {

  constructor(
    private platform: Platform,
    private appMinimize: AppMinimize,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private loginSvc: LoginService,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc,
    private storage: Storage //**REMOVE 
  ) { }

  // Password max Length, can be changed here
  private password_max_length = 12;

  // Presentation Data
  private gmobVersion = environment.AppVersion;
  private loginForm: FormGroup;
  private deviceSerialNumber: string;
  private htmlStr: string = "";

  // Processing Data
  private loggedIn = false;
  private ready2Login = false;
  private initialEntry = true;
  private needSiteAccess = true;
  private siteAccessInfoChangedSubscription: Subscription;
  private loginResultsData = new LoginResultsModel(9, '', 0, 0, '', '', '', 0, 0, '');
  private logoutResultsData = new LogoutResultsModel(9, '', 0, '', '', false);
  private blankLoginResultsData = new LoginResultsModel(9, '', 0, 0, '', '', '', 0, 0, '');
  private blankLogoutResultsData = new LogoutResultsModel(9, '', 0, '', '', false);

  minimizeApp() {
    this.appMinimize.minimize();
  }

  async checkCloseApp() {
    if (!(this.platform.is('android') || this.platform.is('cordova'))) {
      alert('Not available on this device');
      return;
    }

    // check for Dirty W/O's ...
    var msg = " ";
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm you wish to exit app',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => {
            this.connectionSvc.chgLoginState(false);

            navigator['app'].exitApp();



          }  // handler
        }, // text: 'Yes'
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary'
        }
      ]
    });
    await confirmAlert.present();

  }
  onLogoutClick() {
    // #1 Clear Input fields...
    this.loginForm.get('loginName').setValue('');
    this.loginForm.get('password').setValue('');

    // #2 Set isLoggedIn to false
    this.loggedIn = false;
    this.connectionSvc.chgLoginState(false);

    // #23notify server of log out...

   
    this.connectionSvc.isConnected2Server()
    .then (()=> { 
      this.myLoader.present('Logging out...',1000); 
      const url = this.httpRequestsSvc.getSiteServerUrl();
      this.httpRequestsSvc.handleGetRequest(url+'logoff', true)
        .subscribe((data) => {
          this.utilitiesSvc.copyPropertiesObj2Obj(this.blankLogoutResultsData, this.logoutResultsData);
          this.myLoader.dismiss();  
          if (data !== null) {
            const rtnResult = data;
            this.utilitiesSvc.copyPropertiesObj2Obj(rtnResult, this.logoutResultsData);
            this.logoutResultsData.ServerLogoff = true;

            this.applicVarsSvc.saveLogoutResults(this.logoutResultsData);
          }
          else { // login had an error
            let errMsg = '';
            switch (this.loginResultsData.ErrorNum) {
              case 1: {
                errMsg = 'your mobile device ' + this.connectionSvc.deviceHdwId + ' is not registered'; break;
              }
              case 2: {
                errMsg = 'your login name is not correct'; break;
              }
              case 3: {
                errMsg = 'your password is incorrect'; break;
              }
              case 4: {
                errMsg = 'your login is disabled'; break;
              }
              case 5: {
                errMsg = 'user is not set up as mobile user'; break;
              }
              case 6: {
                errMsg = 'user is not set up as employee'; break;
              }
              case 7: {
                errMsg = 'Database name is invalid'; break;
              }
              default: {
                errMsg = 'an unknown reason'; break;
              }
            } // switch
            errMsg = 'Log In failed because ' + errMsg;
            alert(errMsg);
          } // had a login error

        },
          (error) => { // had a HTTP request error
            this.myLoader.dismiss();  
          })
    },
    (err)=>{
      this.applicVarsSvc.saveLogoutResults(this.blankLogoutResultsData); // note: ServerLogoff is false by default
    });

  }


  async openSiteCodePage() {

    if (!this.connectionSvc.deviceIsOnline()) {
      alert('Must be ONLINE for initial Site Access');
    }
    else {

      var data = { message: 'hello world' };
      const modalPage = await this.modalCtrl.create({
        component: SiteCodePage,
        componentProps: { values: data }
      });

      modalPage.onDidDismiss()
        .then((rtnValue: any) => {
          //console.log('Returned from SiteCodePage')
          this.ready2Login = true;

          this.loggedIn = this.connectionSvc.isLoggedIn();

          this.needSiteAccess = (this.applicVarsSvc.siteAccessInfo.siteAbbrevName === "");
          //alert('needSiteAccess='+JSON.stringify(this.needSiteAccess.valueOf)+'\nready2Login='+JSON.stringify(this.ready2Login) );
        });
      return await modalPage.present();
    }
  }

  handleLocalLogin(loginName: string, password: string): boolean {
    //console.log('handleLocalLogin', loginName, password);
    if (this.applicVarsSvc.appVarsData.loginName === '' ||
      this.applicVarsSvc.appVarsData.loginPassword === '') {
      alert('Unable to login off-line');
      return false;
    }
    else {
      this.myLoader.present('Logging in offline...');
      this.lsoRequestsSvc.setSyncDbName(this.applicVarsSvc.getCurrDbName());
      this.lsoRequestsSvc.setLSOnames(this.applicVarsSvc.getLoginUserId());
      this.httpRequestsSvc.setSiteServerUrl(this.applicVarsSvc.getApiRootUrl());
      this.httpRequestsSvc.setBearerToken(this.applicVarsSvc.getApiToken());
      this.masterTableDataSvc.setMTobjsToLSO(true);
      this.afterSuccessfulLogin();
      this.myLoader.dismiss();
      return true;
    }
  }

  afterSuccessfulLogin() {
    this.workorderDataSvc.need2SelectWos = true;
    // ensure at least an empty version of 'attachments' object exists in L/S for GetAllWorkorders to work
    if (!this.lsoRequestsSvc.isTableInLocalStorage('attachments')) 
      this.lsoRequestsSvc.storeObj2Lso(this.workorderDataSvc.attachments, 'attachments');
  }

  handleServerLogin(loginName: string, password: string) {
    this.myLoader.present('Logging in...');
    const encodedPassword = this.utilitiesSvc.encodeSpecialChars2Hex(password);
    //if (environment.DebugMode) console.log('handleServerLogin', loginName, encodedPassword);
    const urlSuffix = 'login/' + this.connectionSvc.deviceHdwId + '/' + loginName + '/' + encodedPassword +
      '/' + this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    this.httpRequestsSvc.handlePostRequest(urlSuffix, false)
      .subscribe((data) => {
        const rtnResult = data;
        this.utilitiesSvc.copyPropertiesObj2Obj(rtnResult, this.loginResultsData);
        this.loggedIn = (this.loginResultsData.ErrorNum <= 0);
        if (this.loginResultsData.ErrorNum === -8) {
          alert('Too many G-Mobility users logged.\n Temporary access granted.');
        }
        this.connectionSvc.chgLoginState(this.loggedIn);
        if (this.loggedIn) {
          this.masterTableDataSvc.doTableMaintenance(); // new functionality 2019-02-26
          this.applicVarsSvc.saveLoginResults(this.loginResultsData, loginName, password);
          this.afterSuccessfulLogin();

          this.masterTableDataSvc.loadAllSmallMasterTables(); 

          this.myLoader.dismiss();
          // test for need to load Large MTs ...
          this.masterTableDataSvc.loadMissingSmallMTs(true); // auto calls the load Large MTs service after Small completes
          //this.navCtrl.navigateRoot('/tabs/sel-workorder');
        }
        else { // login had an error
          let errMsg = '';
          switch (this.loginResultsData.ErrorNum) {
            case 1: {
              errMsg = 'your mobile device ' + this.connectionSvc.deviceHdwId + ' is not registered'; break;
            }
            case 2: {
              errMsg = 'your login name is not correct'; break;
            }
            case 3: {
              errMsg = 'your password is incorrect'; break;
            }
            case 4: {
              errMsg = 'your login is disabled'; break;
            }
            case 5: {
              errMsg = 'user is not set up as mobile user'; break;
            }
            case 6: {
              errMsg = 'user is not set up as employee'; break;
            }
            case 7: {
              errMsg = 'Database name is invalid'; break;
            }
            case 8: {
              errMsg = 'No G-Mobility logins available.'
            }
            default: {
              errMsg = 'an unknown reason'; break;
            }
          } // switch
          errMsg = 'Log In failed because ' + errMsg;
          alert(errMsg);
          this.myLoader.dismiss();
        }

      },
        (error) => {
          this.loggedIn = false;
          this.myLoader.dismiss();
        })
  }

  onloginClick() {
    if (!this.connectionSvc.runningDevInBrowser) {
    }
    if (!this.applicVarsSvc.chkAppVersion()) {
      alert('App needs to be upgraded to a more recent version');
      return;
    }
    const F = this.loginForm; const fV = F.value;

    const cLoginName = this.utilitiesSvc.removeLeadingTrailingSpaces(fV.loginName);
    const cPassword = this.utilitiesSvc.removeLeadingTrailingSpaces(fV.password);
    F.get('loginName').setValue(cLoginName);
    F.get('password').setValue(cPassword);

    this.connectionSvc.isConnected2Server()
    .then (()=> { 
      //console.log('**REMOVE onLoginClick() - IS connected2Server');
      this.handleServerLogin(cLoginName, cPassword);
      this.connectionSvc.chgLoginState(this.loggedIn);
      //alert('prior to nav to wolist');
      //if (this.loggedIn) this.navCtrl.navigateRoot('/tabs/sel-workorder');
    },
    (reject)=>{
      //console.log('**REMOVE onLoginClick() - NOT connected2Server');
      this.loggedIn = this.handleLocalLogin(cLoginName, cPassword);
      this.connectionSvc.chgLoginState(this.loggedIn);
      this.utilitiesSvc.debugAlert(false, 'Used LSO for login: succeeded=>', JSON.stringify(this.loggedIn));
      //if (this.loggedIn)this.navCtrl.navigateRoot('/tabs/sel-workorder');

    });

    //this.httpRequestsSvc.connected2Server = false; //**REMOVE TESTING ONLY */
    /*
    if (!this.httpRequestsSvc.connected2Server) {  // try local login since server isn't available
      this.loggedIn = this.handleLocalLogin(cLoginName, cPassword);
      this.connectionSvc.chgLoginState(this.loggedIn);
      this.utilitiesSvc.debugAlert(false, 'Used LSO for login: succeeded=>', JSON.stringify(this.loggedIn));
      if (this.loggedIn)
        this.navCtrl.navigateRoot('/tabs/sel-workorder');
    }
    else { // try server login
      this.handleServerLogin(cLoginName, cPassword);
      this.connectionSvc.chgLoginState(this.loggedIn);
      if (this.loggedIn) this.navCtrl.navigateRoot('/tabs/sel-workorder');
    }
    */
  }

  displayLoginButton(): boolean {
    return true;
  }

  ionViewDidLeave() {
    //console.log('**REMOVE** LOGIN: ionViewWillLeave');
    //this.masterTableDataSvc.setMTobjsToLSO(true); 
  }

  ionViewDidEnter() {
    this.workorderDataSvc.need2SelectWos = true;
    if (this.initialEntry) {
      this.initialEntry = false;
      if (environment.DebugMode) {
        //console.log('from Login: DeviceId ==>', this.connectionSvc.deviceHdwId);
        //console.log('LSObjects =>', this.lsoRequestsSvc.localStorageTables);
      }
    }
    else {
    }
  }
  setSiteAccessInfo() {
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
        this.utilitiesSvc.copyPropertiesObj2Obj(siteData, this.applicVarsSvc.siteAccessInfo);
        console.log( '#1 LSO Site Access Info -->', siteData, this.applicVarsSvc.siteAccessInfo); 
        this.lsoRequestsSvc.setSyncDbName(this.applicVarsSvc.siteAccessInfo.siteSyncDbName);
        //const siteCode = this.applicVarsSvc.siteAccessInfo.siteAbbrevName;
        //const siteKey = this.applicVarsSvc.siteAccessInfo.siteKeyCode;
        this.httpRequestsSvc.setSiteServerUrl(this.applicVarsSvc.siteAccessInfo.siteServerUrl); // sets httpRequestsSvc.siteServerUrl
        this.lsoRequestsSvc.setSyncDbName(this.applicVarsSvc.siteAccessInfo.siteSyncDbName);
  
        //---------------------------------
        // #2  Retrieve deviceData
        this.lsoRequestsSvc.getDataFromLocalStorage('deviceData')
        .then ((devData)=> {  
          let failed2RetrieveSDeviceData = (devData == null);
          if (!failed2RetrieveSDeviceData) { // Retrieved SiteAccessInfo
            this.utilitiesSvc.copyPropertiesObj2Obj(devData, this.applicVarsSvc.deviceData);
            console.log('#2 LSO deviceData =>', devData, this.applicVarsSvc.deviceData );
  
            //---------------------------------
            // #3  Retrieve applicVarData
            this.lsoRequestsSvc.setLSOnames(devData.loginUserId);
            this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.applicVarsLSOname)
            .then ((applicData)=> {  
              let failed2RetrieveApplicVarsData = (applicData === null);
              if (!failed2RetrieveApplicVarsData) { // Retrieved SiteAccessInfo
                this.utilitiesSvc.copyPropertiesObj2Obj(applicData, this.applicVarsSvc.appVarsData);
                console.log('#3 LSO appVarsData =>', this.applicVarsSvc.appVarsData) ;
  
                // Now do final processing after successfully retrieving the Admin LSOs...
                let prevAppVersion = "";
                if (this.applicVarsSvc.deviceData.prevAppVersion !== "") prevAppVersion = this.applicVarsSvc.deviceData.prevAppVersion 
                else prevAppVersion = "1.0.0.0";
                if (this.utilitiesSvc.cmpVersion3rdElement(environment.AppVersion, prevAppVersion)) {
                  alert('New app version '+environment.AppVersion+' (prev '+prevAppVersion+') requires refresh to local data');
                  this.applicVarsSvc.clearLocalStorage(false);
                } 
                else {
                  //if (connected2Server) this.getServerAccessSiteInfo()
                  //if (this.connectionSvc.deviceIsOnline()) this.getFirebaseAccessSiteInfo() else 
                  this.loginSvc.setNewSiteAccessInfo(this.applicVarsSvc.siteAccessInfo); 
                  
                }   
              } 
            } // Retrieved applicVarData
            ) // (applicData)
            .catch(err=>{ alert('Failed to read LSO: '+this.lsoRequestsSvc.applicVarsLSOname) } )         
          } 
        } // Retrieved devData
        ) // (devData)
        .catch(err=>{ alert('Failed to read LSO: '+this.lsoRequestsSvc.deviceDataLSOname) } )
      } // Retrieved SiteAccessInfo
  
      else { // no SiteAccessInfo found :()
        // note: the subscription that executes will deal with no SiteAccessInfo found
        this.loginSvc.setNewSiteAccessInfo(this.applicVarsSvc.siteAccessInfo);
      }   
    } ) // (siteData)
    .catch(err=>{ alert('Failed to read LSO: '+this.lsoRequestsSvc.siteAccessInfoLSOname) } )
  
  }
  

  ngOnInit() {
    //this.lsoRequestsSvc.clearLocalStorage() // testing only

    // Note: the following properties were set in the app.component.ts OnReady() function:
    // 1. this.connectionSvc.deviceHdwId
    // 2. this.lsoRequestsSvc.localStorageTables

    this.loginForm = new FormGroup({
      'loginName': new FormControl('', [Validators.required]),
      'password': new FormControl('', [Validators.minLength(this.password_max_length), Validators.required]),
      'siteCode': new FormControl('', [Validators.required])
    });
  
  /*
    const dt1 = new Date();
    this.lsoRequestsSvc.getDataFromLocalStorage('xdeviceData')
    .then ((devData)=> {  
      const dt2 = new Date();
      console.log('**REMOVE - TEST devData =>', devData, dt2.getMilliseconds());
      if (devData == null) {
        console.log('**REMOVE - TEST devData is null');
      } });
      console.log('**REMOVE - AFTER TEST devData ', dt1.getMilliseconds());
  */
    //const dtStr = '2022/04/31'; // currDate.toISOString();
    //this.utilitiesSvc.validateDaysOfMonth(dtStr);

    //console.log(this.utilitiesSvc.cmpVersion3rdElement('1.2.3.4', '1.2.3.5'));
/** 
    this.lsoRequestsSvc.getDataFromLocalStorage('ralphtest') // **REMOVE THIS 
    .then ((data)=> {  
      if (data == null) console.log('result of test read from LSO', data)
      else console.log('result of test read from LSO is **null** ') }
    ,(error)=> {console.log('result of test read from LSO: ERROR', error) } );
*/
    this.connectionSvc.isConnected2Server(8000)
    .then (()=> {
      this.setSiteAccessInfo(); // this triggers -> loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);         
    },
    (reject)=> {
      this.setSiteAccessInfo(); // this triggers -> loginSubSvc.setNewSiteAccessInfo(this.siteAccessInfo);     
    }
    )

    //* REMOVE FOLLOWING */
    /*
     const arr1 = [1,2,4, 7, 9];
     arr1.splice(3,1);
     console.log('***TEST**** ', '[1,2,4, 7, 9]', arr1);
      /*
     const arr2 = []; //[0,3,5];
     var newArr: Array<number> = [];
     newArr = [...arr2, ...arr1];
     console.log('**JOINING ARRAYS', newArr, arr2, arr1);
     */
    /* 
    this.storage.ready().then (()=> 
      this.storage.remove('attachments')
      .then (()=>console.log('**REMOVED LSO attachments!')));
    /* 
      this.storage.get('ATTACHMENTS_STORAGE_KEY').then ((data)=> {
        console.log('ATTACHMENTS_STORAGE_KEY data ==>', data);
        if (data === null) console.log('ATTACHMENTS_STORAGE_KEY DATA IS NULL!!');
        this.storage.remove('ATTACHMENTS_STORAGE_KEY');
      }), (err)=> console.log('STORAGE error ==>', err) ; 

    /* */

    // the following is only executed if the siteAccessInfo (Key & Code) change
    this.siteAccessInfoChangedSubscription = this.loginSvc.siteAccessInfoChanged
      .subscribe(
        (newSiteAccessInfo: SiteAccessInfo) => {
          console.log('**CHECK FOR RECURSIVE CALL: setNewSiteAccessInfo');
          if (this.utilitiesSvc.debugIssue('1900-00')) console.log('Subscribe-siteAccessInfoChanged-01');
          if (this.applicVarsSvc.siteAccessInfo.siteAbbrevName.indexOf('RALPHTEST') === 0) {
            const F = this.loginForm;
            this.loginForm.get('loginName').setValue('ralph');
            this.loginForm.get('password').setValue('ralph');
          }
          this.needSiteAccess = (!newSiteAccessInfo || newSiteAccessInfo.siteAbbrevName == '');
          //console.log('needSiteAccess =>', this.needSiteAccess, newSiteAccessInfo);
          //this.needSiteAccess = false; // *** REMOVE *** TEstinG ONLY
          if (this.needSiteAccess) {
            this.loggedIn = false;
            this.connectionSvc.chgLoginState(false);
            if (!this.connectionSvc.deviceIsOnline()) 
            {
              alert('Must be ONLINE for initial Site Access');
            }
            else
              this.openSiteCodePage();
          }
          else {
            this.myLoader.present('Initializing...',1000); 
            this.applicVarsSvc.getDevice_ApplicDataFromLocalStorage()
              .then(() => {
                const loginName = this.applicVarsSvc.getLoginName();
                this.ready2Login = true;
                if (loginName === '') {
                  this.loggedIn = false;
                  this.connectionSvc.chgLoginState(false);
                }
                else 
                {
                  this.loginForm.get('loginName').setValue(loginName);
                }
                this.myLoader.dismiss();  
                //console.log('applicVarsSvc.storeDeviceDataInLocalStorage()', 
                //this.applicVarsSvc.getLoginName(), this.applicVarsSvc.getLoginUserId());
              },
            (err)=>{
              this.myLoader.dismiss();  } )
          }
        }
      );
    // #1 check what SiteCode & Key exists in LSO ...    

    /* TESTING ONLY ... */

    /*
      console.log('>> TESTING CONTENTS OF MACH STATES FROM LSO:', this.masterTableDataSvc.getMachineStateCodes());
      console.log(this.lsoRequestsSvc.getDataFromLocalStorage('MachineStates-TestRcSync'));
    // TESTING ONLY .
      this.lsoRequestsSvc.getDataFromLocalStorage('Employees-TestRcSync')
          .then( (data)=> {console.log('Employees-TestRcSync', data)});
    */
    /*
    console.log('['+this.utilitiesSvc.removeLeadingTrailingSpaces(' completed ')+']');
    */
    // completed 
    //01234567890
    /* run 1x only */
    //this.lsoRequestsSvc.removeLSObject('18-workorders');
    //this.lsoRequestsSvc.removeLSObject('Trades-TestRcSync');
    //this.lsoRequestsSvc.removeLSObject('WoSecurity-TestRcSync');
    //this.lsoRequestsSvc.removeLSObject('attachments');
    //this.lsoRequestsSvc.removeLSObject('images');

    /*
    const currDt = this.utilitiesSvc.currDateOnly();
    const dt1 = new Date('2019-01-30');
    console.log('Dates: ', currDt, dt1, currDt.valueOf()-dt1.valueOf());
    const dt2 = new Date('2019-02-28');
    console.log('Dates: ', currDt, dt1, currDt.valueOf()-dt2.valueOf());
    const dt3 = new Date('2019-03-01');
    console.log('Dates: ', currDt, dt1, currDt.valueOf()-dt3.valueOf()); */

    //this.htmlStr="<h2> Testing HTML string </h2>";
    /*
        var hrs = 2.2  
        console.log('Round '+hrs.toString(), this.utilitiesSvc.roundHrsClosest(hrs, .25));
        hrs = 2.7  
        console.log('Round '+hrs.toString(), this.utilitiesSvc.roundHrsClosest(hrs, .25));
        hrs = 2.9
        console.log('Round '+hrs.toString(), this.utilitiesSvc.roundHrsClosest(hrs, .25));
        hrs = 1.234
        console.log('Round to nearst .01: '+hrs.toString(), this.roundHrsUp(hrs, .01));
    
        hrs = 1.235
        console.log('Round to nearst .01: '+hrs.toString(), this.roundHrsUp(hrs, .01));
    
        hrs = 1.236
        console.log('Round to nearst .01: '+hrs.toString(), this.roundHrsUp(hrs, .01));
        hrs = 1.2
        console.log('Round to nearst .01: '+hrs.toString(), this.utilitiesSvc.inputRoundHrsDec01(hrs));
        
    
        hrs = 1.23
        console.log('Round to nearst .01: '+hrs.toString(), this.utilitiesSvc.inputRoundHrsDec01(hrs));
        
        hrs = 1.234
        console.log('Round to nearst .01: '+hrs.toString(), this.utilitiesSvc.inputRoundHrsDec01(hrs));
    
        hrs = 1.235
        console.log('Round to nearst .01: '+hrs.toString(), this.utilitiesSvc.inputRoundHrsDec01(hrs));
        
    
        this.storage.ready()
        .then (()=>
      this.storage.get('attachments')
      .then((data)=>{
        alert('ATTACHMENTS =>'+JSON.stringify(data));
      })
    );
    
    */

    /*
      const lastWoSyncDT = new Date();
      setTimeout(()=>{
       const currDt = new Date();
       console.log('delta ms -->', currDt.getTime() - lastWoSyncDT.getTime());
       this.utilitiesSvc.getTimeDeltaMinutes(currDt, lastWoSyncDT);
      },6000); */

    /*
      this.httpRequestsSvc.handleGetRequest('remote1.circlegsoftware.com/api/nothing', false)
      .subscribe(()=>{console.log('HTTP CONNECTION GOOD!')},
      (err)=> {console.log('HTTP CONNECTION **FAILED**!', err)}
      );
    
    */

  }

  ngOnDestroy() {
    this.siteAccessInfoChangedSubscription.unsubscribe();
  }
}
