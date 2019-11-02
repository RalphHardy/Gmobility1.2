import { Injectable } from '@angular/core';
import { tap, map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Storage } from '@ionic/storage';

// services
import { UtilitiesSvc } from './utilities.svc';

//data
import { environment } from '../../environments/environment';
const debugMode = environment.DebugMode;

@Injectable({
  providedIn: 'root'
})
export class LsoRequestsService {

  constructor(
    private storage: Storage) { }

  public localStorageTables: string[] = [];
   
  public LSOuserId: string = '';  
  public userNumSeqLSOname: string = ''; 
  public applicVarsLSOname: string = '';  // Local Storage Object Name
  public workordersLSOname: string = '';  // Local Storage Object Name
  public workRequestsLSOname: string = '';
  public syncDbName: string = ''; 
  public siteAccessInfoLSOname = 'siteAccessInfo';
  public deviceDataLSOname = 'deviceData';

  // These Set LST name functions are invoked after Login ...
  setLSOnames(userId: number) {
    this.LSOuserId = userId.toString();
    this.applicVarsLSOname = this.LSOuserId+'-applicVars'
    this.workordersLSOname = this.LSOuserId+'-workorders-'+this.syncDbName;
    this.workRequestsLSOname = this.LSOuserId+'-workRequests-'+this.syncDbName;
    
    //console.log('##2-02 ls-requests setLSOnames()', this.applicVarsLSOname , this.workordersLSOname);
  }
  setSyncDbName(val: string) {
    this.syncDbName = val;
  }

  clearLocalStorage() {
    this.storage.ready().then(() => {
      this.storage.clear();
      this.localStorageTables.length = 0;
      //console.log('--> CLEARED LOCAL STORAGE <--');
      });
  }

  removeAllStorageItems() {
    this.storage.ready().then(() => {
      this.storage.forEach( (value, key, index) => {
        //console.log('**REMOVING ** STORAGE ITEM:', key, index);
        const idx = this.localStorageTables.indexOf(key);
        if (idx > -1) this.localStorageTables.splice(idx);
        this.storage.remove(key);
      }); 
      this.localStorageTables.length = 0;
    });		
  }

  removeAdminLSObjects() {
    this.storage.ready().then(() => {
      this.storage.forEach( (value, key, index) => {
        if ( (key.indexOf('deviceData') > -1) ||
        (key.indexOf('siteAccess') > -1) || 
        (key.indexOf('DbInfo') > -1) || 
        (key.indexOf('applicVars') > -1) ) {
          const idx = this.localStorageTables.indexOf(key);
          if (idx > -1) this.localStorageTables.splice(idx);
          this.storage.remove(key);
        }
      }); 
    });		
  }

  removeLSObject(key: string) {
    this.storage.ready().then(() => {
      //console.log('**REMOVE LS Object:', key);
      const idx = this.localStorageTables.indexOf(key);
      if (idx > -1) this.localStorageTables.splice(idx);
      this.storage.remove(key);
    });		
  }

  createListOfLSObjects() {
    this.storage.ready().then(() => {
      this.storage.keys()
      .then ( (result) => {
        const listTbls = result;
        this.localStorageTables.length = 0;
        for (var item of listTbls) this.localStorageTables.push(item);
        if (environment.DebugMode) 
          console.log('>>> WHATS IN LOCAL STORAGE ==>', this.localStorageTables);			
      });	
    });
  }
  
/*
  return this.http.get(url, { headers: headers })
  .pipe(map(
      (data: Response) => { 
        const rtnResult = data;
        return rtnResult;
        }
      ))   
  .pipe(catchError( (err: HttpErrorResponse) => {
    return throwError(err);
    })
  )  
  */

  addLocalStorageTableName(tableName: string) {
    if (!this.isTableInLocalStorage(tableName)) {
      this.localStorageTables.push(tableName);
    }
  }

  listLocalStorageTables():string[] {
    return this.localStorageTables;
  }
  
  isTableInLocalStorage(tableName: string): boolean {
    let result = false;
    let idx = (this.localStorageTables.findIndex( el => el == tableName) );
    result = (idx > -1);    
    ////console.log('Check if TABLE '+tableName+' is in storage:', result, idx, this.localStorageTables);	
    return result;  
  }

  public async storeObj2Lso(value: any, keyStr: string) {
    return this.storage.remove(keyStr) // clear out any old data stored for keyStr 
    .then ((successData) => this.storage.set(keyStr, value)
      .then((successData)=>{
        if (environment.DebugMode) console.log('***DATA STORED FOR '+keyStr+' ==>', successData);
      }));
  }
 
  storeDataInLocalStorage(value: any, keyStr: string) {
    this.storage.remove(keyStr) // clear out any old data stored for keyStr 
    .then ((successData) => this.storage.set(keyStr, value)
      .then((successData)=>{
        if (environment.DebugMode) console.log('***DATA STORED FOR '+keyStr+' ==>', successData);
      }));
  }

  public async getDataFromLocalStorage(keyStr: string) {
    return this.storage.get(keyStr);
    /* .then((data) => {
      console.log('inside getDataFromLocalStorage =>', data);
      for ( let item in data ) {
        dataArray.push(data[item]);then((data) => {
      console.log('inside getDataFromLocalStorage =>', data);
      for ( let item in data ) {
        dataArray.push(data[item]);
      }
      //console.log('getDataFROMlocalStorage for '+keyStr+' ==>', dataArray);
    }).catch(err => console.log('ERROR: UNABLE to load from offline storage for '+keyStr, err ));
  */
  }


}
