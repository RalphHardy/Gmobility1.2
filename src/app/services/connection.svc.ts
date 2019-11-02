import { Injectable } from '@angular/core';
//import 'rxjs/Observable';
//import 'rxjs/add/operator/catch';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device/ngx';
import { Network } from '@ionic-native/network/ngx';

//Services
import { HttpRequestsService } from '../services/http-requests.service';
import { UtilitiesSvc } from '../services/utilities.svc';
import { LoadingService } from '../services/loading.service';

//Models
import { SiteAccessInfo } from '../models/app-vars-model';

//Data
import { environment } from '../../environments/environment';
import { resolve } from 'q';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;
const gmobilityUrl = environment.GmobilityUrl;

@Injectable({
  providedIn: 'root'
})

export class ConnectionSvc {
  constructor(private network: Network,
    private http: HttpClient,
    private storage: Storage,
    private device: Device,
    private utilitiesSvc: UtilitiesSvc,
    private httpRequestsSvc: HttpRequestsService,
    private myLoader: LoadingService
  ) {
    }
    public deviceHdwId = 'A1B2C3D4';
    private loggedInState = false;
    private siteSyncDbName = '';
  
    // ** SYS-WIDE CONSTANTS ** //
    public runningDevInBrowser: boolean = this.network.type == null;
    public testOffline: boolean;

    //--- save this and prev route paths
    private currPrevRoutes = ['/','/'];
    setParentRoot(currRoute: string) {
      //console.log('>> Setting Parent Root: 0 was:', this.currPrevRoutes[0]);
      this.currPrevRoutes[0] = this.currPrevRoutes[1];
      this.currPrevRoutes[1] = currRoute;
      //console.log('>> Setting Parent Root: now set to:', this.currPrevRoutes);
    } 

    getParentRoot(): string {
      return this.currPrevRoutes[0];
    }
    getPrevRoute(): string {
      return this.currPrevRoutes[1];
    }
    //--- save this and prev route paths
   
    isConnected2Server(waitTime?: number) {
        if (!waitTime) waitTime = 6000;
        return new Promise((resolve, reject)=> {
          if (!this.deviceIsOnline()) {
            this.httpRequestsSvc.connected2Server = false;
            // if (this.utilitiesSvc.debugIssue('1906-20'))console.log('isConnected2Server(): Device is NOT online');
            return reject(false);
          }
          else { // the device is online
            this.myLoader.present('Looking for server...',waitTime); 
            // console.log('isConnected2Server(): Device IS online - before HTTP');
            this.httpRequestsSvc.connected2Server = false; // default for case of no response
            this.httpRequestsSvc.testServerConnection()
            .subscribe(()=>{ 
              this.myLoader.dismiss(); 
              return resolve (true);   
            },
              (err)=>{ 
                this.myLoader.dismiss(); 
                return reject(false);     
              }
            );
          }  // the device is online
        });
      // if NOT deviceIsOnline() then simply fall through with this.httpRequestsSvc.connected2Server = false;
    }

    //* The following function is used to turn on/off (boolean) icons */
    checkIfConnected2Server(giveAlert?: boolean): boolean {
      if (!this.deviceIsOnline()) {
        this.httpRequestsSvc.connected2Server = false;  
        alert('Mobile is not connected to either data or wireless');
        return false;
      }

      this.isConnected2Server(8000)
      .then (()=> {
        return this.httpRequestsSvc.connected2Server;     
      },
      (reject)=> {
        return this.httpRequestsSvc.connected2Server;  
      }
      );
  }
/** 
      if (!this.deviceIsOnline()) {
        if (giveAlert) alert('You have no wireless or data connectivity');
        resolve false;
      }
      else {
        var waitTime = 10000;
        if (giveAlert) waitTime = 6*waitTime;
        this.myLoader.present('Looking for server...',waitTime); //allow 3 minutes to respond
        this.httpRequestsSvc.testServerConnection()
        .subscribe(()=>{ 
          this.httpRequestsSvc.connected2Server = true;  
          if (giveAlert) alert('You are now connected to your server');
          this.myLoader.dismiss();
          //return true;
        },
          (err)=>{            
            this.httpRequestsSvc.connected2Server = false;
            if (giveAlert) alert('You are unable to connect to your server');
            this.myLoader.dismiss();
            //return false;
          }
        );
      }

    }
    */

    connectedUsingData(){
      //console.log('check if connected using DATA, type ==>', this.network.type);
      const networkType = this.network.type.toUpperCase();		
      if (networkType.indexOf('G') == 1 || networkType.indexOf('LTE') == 1 || networkType == 'CELLULAR'){
        return true;
      }
      //else
      return false;
    }
  
    connectedUsingWifi(){
      //console.log('check if connected using DATA, type ==>',  this.network.type);
      if(this.network.type=='wifi'){
        return true;
      }
      return false;		
    }
  
    deviceIsOnline(){
      if (this.checkIfTestOffline())return false;
      if (this.runningDevInBrowser) {
        this.httpRequestsSvc.connected2Server = true;
        return true; // running off-Mobile in browser
      }
      //else		
      if (!(this.connectedUsingWifi() || this.connectedUsingData())) this.httpRequestsSvc.connected2Server = false;
      return this.connectedUsingWifi() || this.connectedUsingData();
    }

    setDeviceHdwId() {  
      const platform: string = this.device.platform;	
      var deviceId = 'A1B2C3D4'; // '52001393EC6CA4C9';
      ////console.log('DEVICE S/N ==>', deviceSerialNum, typeof deviceSerialNum);
      if (platform) {
        deviceId = this.device.serial;
        if ( deviceId == 'unknown' ) {
          deviceId = this.device.uuid;
          if ( deviceId.length > 16 ) {
            deviceId = this.utilitiesSvc.getLastChars(deviceId, 16);
          }
        }
      }
      this.deviceHdwId = deviceId.toUpperCase();
      if (environment.MobileDebug) alert('Phone Id='+deviceId);
    }

   /*   
    getSiteAccessInfoFromServer(accessSiteName: string, accessKeyCode: string) {
      // send GET REQUEST to GMOBILITY SERVER
      const cnvAccessKeyCode = this.utilitiesSvc.encodeSpecialChars2Hex(accessKeyCode);
      const liveUrl = gmobilityUrl+'GetSite/'+accessSiteName+'/'+cnvAccessKeyCode;  
    
      this.http.get(liveUrl, { headers: this.createHttpHeader() })
        .toPromise()
        .then (
        (value)  => {                
          this.applicVarsSvc.siteAccessInfo = <SiteAccessInfo>value;
          this.applicVarsSvc.storeSiteAccessInfoInLocalStorage(this.applicVarsSvc.siteAccessInfo);
          this.applicVarsSvc.setCurrDbName(this.applicVarsSvc.siteAccessInfo.siteSyncDbName);
          this.applicVarsSvc.setApiRootUrl(this.applicVarsSvc.siteAccessInfo.siteServerUrl);
          //console.log('+++siteAccessInfo -->', this.applicVarsSvc.siteAccessInfo);	
        },
        msg => {
          //loader.dismiss();
          //console.log('Unable to Retrieve site Access Info from Server');
          //call function to reterive data from device storage		
          //dataArray = this.getDataFromLocalStorage(LSOname);
        }
        )
    }
    */
  
    // HANDLE FILE TRANSFER REQUESTS
  
    uploadFileFromServer(woNumber: string, pathFileName: string) {
      //console.log('uploadFileFromServer', woNumber, pathFileName);
      
    }

    chgLoginState(newLoginState: boolean) {
      this.loggedInState = newLoginState;
      //console.log('new logged in state -> ', this.loggedInState);
    }    

    isLoggedIn(): boolean {
      return this.loggedInState;
    }

    checkIfTestOffline():boolean {
      this.testOffline = (environment.TestOffline && this.deviceHdwId=='A1B2C3D4');
      this.utilitiesSvc.debugAlert(false,'checkIfTestOffline:', JSON.stringify(this.testOffline) + this.deviceHdwId);
      return(this.testOffline);
    }

    chgSiteSyncDbName(newVal: string) {
      this.siteSyncDbName = newVal;
    }
    getSiteSyncDbName(): string {
      return this.siteSyncDbName;
    }

}
