import { Injectable, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { map, max } from 'rxjs/operators';
import { Subscription } from 'rxjs';

//Services
import { HttpRequestsService } from '../services/http-requests.service';
import { LsoRequestsService } from '../services/lso-requests.service';
import { UtilitiesSvc } from '../services/utilities.svc';
import { LoadingService } from './loading.service';
import { ConnectionSvc } from './connection.svc';
import { ApplicVarsSvc } from './applic-vars.svc';
import { MasterTableDataSvc } from './master-table-data.svc';
import { WoSubscriptionService } from './wo-subscription.service';
import { Base64 } from '@ionic-native/base64/ngx';

//Models
import { WorkorderModel, WorkorderCreateModel, WorkorderEditModel } from '../models/workorder-model';
import { WoLaborLineModel, WoLaborAddEditModel } from '../models/wo-labor-line-model';
import { WoActualTimeModel } from '../models/wo-actual-time-model';
import { WoMaterialLineModel } from '../models/wo-material-line-model';
import { WoNoteModel } from '../models/wo-note-model';
import { AttachFilesLsoModel } from '../models/wo-attach-files-model';


//Data
import { environment } from '../../environments/environment';
import { WoAttachFilesModel } from '../models/wo-attach-files-model';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Injectable({
  providedIn: 'root'
})

export class WorkorderDataSvc {

  constructor(    
    private alertCtrl: AlertController,
    private utilitiesSvc: UtilitiesSvc,
    private applicVarsSvc:ApplicVarsSvc,
    private connectionSvc: ConnectionSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader1: LoadingService,
    private myLoader2: LoadingService,
    private woSubscriptionSvc: WoSubscriptionService,
    private base64: Base64) {   
    // to be executed upon creation of WorkorderDataSvc...      

    const ATTACHMENTS_STORAGE_KEY = 'attachments';   
    var debugStr = ''; 

    this.triggerSaveNextWoSubscription = this.woSubscriptionSvc.triggerSaveNextWo 
    .subscribe(
      (arrIdx: number) =>  {
        
          const woIdx = this.need2SyncWOs[arrIdx];
          const woNum = this.WoData[woIdx].WoNumber;
          this.myLoader1.dismiss();
          this.fixWoDataProblems(woIdx);
          
          this.myLoader1.present("Syncing W/O# "+woNum+"...");
          if (this.utilitiesSvc.debugIssue('1906-20')) console.log('Saving W/O Idx: ', woIdx,' W/O #:', woNum+' to server...')

          this.WoData[woIdx].DirtyFlag = false;
          const WO = this.WoData[woIdx];
          
          if (WO.WoNotes.length>0) {
            for (let i = 0; i < WO.WoNotes.length; i++) {
              const checkthisout = WO.WoNotes[i].NotePriority;
              if (!WO.WoNotes[i].NotePriority) WO.WoNotes[i].NotePriority = false; else WO.WoNotes[i].NotePriority = true;
              //console.log('**REMOVE i=',i,' pre WoNotes.priority = ', checkthisout, ', post =', WO.WoNotes[i].NotePriority);
            }              
          }

          /* * * * * * */
          this.unfixWoDates(this.WoData[woIdx]); /* 2019-05-27 added line */
          //console.log('##1-11 woIdx / woNum =>', woIdx, woNum, this.WoData[woIdx]);
          this.httpRequestsSvc.handlePostWorkorder(this.WoData[woIdx])
          .subscribe( //*1
            <WorkorderModel>(data) => {
              //this.utilitiesSvc.debugAlert(true,'httpRequestsSvc.handlePostWorkorder success response, data.code / data= ', JSON.stringify(data.Code)+ ', data=' +JSON.stringify(data));
              if (data.Code !== 0) {
                alert('Error trying to save W/O '+woNum+'. '+data.Description);
                this.WoData[woIdx].DirtyFlag = true;
              }
              else {
                // now remove the wo from the unsentWorkorders array ...
                if (this.unsentWorkorders.length <= 1) this.unsentWorkorders.length = 0
                else {
                  const unsentWoIdx = this.findWoInArray2(this.unsentWorkorders, this.WoData[woIdx].WoNumber);
                  if (unsentWoIdx > -1) this.unsentWorkorders.splice(unsentWoIdx);
                  //console.log('##1-12 SPLICING/Removing WO from unsentWoIdx: ', unsentWoIdx, this.unsentWorkorders);
                }
              }
              const LSOname = this.lsoRequestsSvc.workordersLSOname;
              //console.log('##1-13 Storing LSO WoData', this.WoData);
              this.lsoRequestsSvc.storeDataInLocalStorage(this.WoData, LSOname); 
              // check if we've successfully finished sending dirty w/o's to the server
              this.need2SyncWOs.splice(0,1); 
              
              //console.log('##1-14 after removing dirty w/o from this.need2SyncWOs', this.need2SyncWOs);           
              if (this.need2SyncWOs.length > 0) this.woSubscriptionSvc.execTriggerSaveNextWo(0);
              else { // if just finished saving the last dirty W/O to the server ... 
                this.myLoader1.dismiss();
                this.woSubscriptionSvc.execTriggerSaveNextImage(0);
                //} 
              }
              
              this.myLoader1.dismiss();
            },        
            (err) => {
              this.WoData[woIdx].DirtyFlag = true;
              this.myLoader1.dismiss();
              // Abandon further processing
              this.need2SyncWOs.length = 0;
              this.need2SyncImages.length = 0;
              this.doneResync = true;
              //console.log('##1-31 doneResync', this.doneResync);
              alert('ERROR: Unable to save to server!');
            } //*1
          ); // subscribe to HTTP request
      } );  
    
      // to be executed upon creation of WorkorderDataSvc...      
      this.triggerSaveNextImageSubscription = this.woSubscriptionSvc.triggerSaveNextImage
      .subscribe(
        (arrIdx: number) =>  {
            //if (this.need2SyncImages.length > 0) {
              if (this.httpRequestsSvc.connected2Server && (this.need2SyncImages.length > 0)) {
                const attIdx = this.need2SyncImages[arrIdx];
                const woNum = this.attachments[attIdx].WoNumber;
                this.myLoader1.present("Sending image for W/O# "+woNum+"...");
                debugStr=debugStr+'Saving IMAGE Idx: '+attIdx.toString()+' W/O #:'+ woNum+' to server \n';
              
                this.base64.encodeFile(this.attachments[attIdx].FilePathName)
                .then((rawBase64: string) => {
                  const beginIdx=rawBase64.indexOf('base64')+7;
                  let base64Str = rawBase64.substring(beginIdx);
                  
                  const base64Json = {Data: base64Str};
                  //alert('Base64:'+base64Json);
                  debugStr=debugStr+'base64 has length of '+base64Str.length+', Prior to HTTP save image \n';
                
                  this.httpRequestsSvc.handlePostDataRequest('SendWoImage/'+woNum
                    +'/'+this.attachments[attIdx].MobDispSeq+'/'+this.attachments[attIdx].FileName, base64Json)
                  .subscribe((httpReq)=>{
                    debugStr=debugStr+'Image saved OK \n';
                    // now change need2Send2Server to false and save 
                    this.attachments[attIdx].Need2Send2Server = false; // unset the flag  
                    this.attachments[attIdx].TransferToEnt = true; // set to true after successfully copied to server

                    this.lsoRequestsSvc.storeDataInLocalStorage(this.attachments, ATTACHMENTS_STORAGE_KEY); 
                    debugStr=debugStr+'After update attachements LSO; Done this one';  
                    this.need2SyncImages.splice(0,1);   
                    this.utilitiesSvc.debugAlert(false, 'Sending Image to Server: ', debugStr);   

                    if (this.need2SyncImages.length > 0) this.woSubscriptionSvc.execTriggerSaveNextImage(0); 
                    else {
                      this.doneResync = true;
                      //console.log('##1-32 doneResync', this.doneResync);
                      this.myLoader1.dismiss(); 
                    }           
                  },
                  (httpErr)=> {                    
                    // Abandon further processing
                    this.need2SyncImages.length = 0;
                    alert('Error sending image to server: '+JSON.stringify(httpErr));
                    this.doneResync = true;
                    //console.log('##1-33 doneResync', this.doneResync);
                    this.myLoader1.dismiss();
                  })
          
                }, (err) => {
                  alert('err encoding Base64:'+JSON.stringify(err));
                  this.myLoader1.dismiss();
                  // Abandon further processing
                  this.doneResync = true;
                  //console.log('##1-34 doneResync', this.doneResync);
                  this.need2SyncImages.length = 0;
                });
                
             // } // if device-is-online
             /* */
            }
          else {
            this.doneResync = true;
            this.myLoader1.present("Retrieving work orders from server...");
            //console.log('##1-39 doneResync', this.doneResync);
          }
        } );        
    }
    
  // presentation data

  // processing data
  public need2SelectWos = true; // used by login & sel-workorder pages
  private lastWoSyncDT = new Date('01-01-1970 00:00:00');
  private forceResync = false;
  private doneResync: boolean = false;
  private Ok2GetWosFromServer: boolean = true;
  private need2SyncWOs: Array<number> = [];
  private need2SyncImages: Array<number> = [];
  public attachments: AttachFilesLsoModel[] = [];
  public blankLaborLine: WoLaborLineModel = this.createLaborLineObject();
  private triggerSaveNextWoSubscription: Subscription;
  private triggerSaveNextImageSubscription: Subscription;

  createWorkorderObject(): WorkorderModel {
    return new WorkorderModel('','',false,false,'','', '',0,'','',
      0,'',0,0,'', 0,'',0,'','', // 20
      '','','','','', '','','','','',
      0,'','',0,'', '','','','','', // 40
      0,'','',0,'',  '','',[],[], [], []); //51
  }

  createAddWorkorderObject(): WorkorderCreateModel {
    return new WorkorderCreateModel('','','','','',  0,'',0,'',0, //10
     '', 0,'','','',  '','','','','', //20
     0,0,'','','',   0,'', '', '','', //30
     '',0,'','','','', '','','',false);
  }
  createEditWorkorderObject(): WorkorderEditModel {
    return new WorkorderEditModel('','','','','',  0,'',0,'',0, 
      '',0,'','','',  '','','','',false,
      '','','','','');
    }

  createLaborLineObject(): WoLaborLineModel {
    return new WoLaborLineModel('',0,'','',0,0,0,'','','','',[],0,'',false);
  }
  createAddEditLaborLineObject(): WoLaborAddEditModel {
    return new WoLaborAddEditModel('',0,'','',  0,'','',0,'','', '');
  }
  createMaterialLineObject(): WoMaterialLineModel {
    return  new WoMaterialLineModel('','','',0, 0,0,0,'','',  '','','','','',  '','','','','',  0,'',0,'',false,  0);
  }

  createTimeCardObject():WoActualTimeModel {
    return new WoActualTimeModel('','','01/01/1900','','','',0,0,'',false);  
  }

  createNoteLineObject(): WoNoteModel {
    return new WoNoteModel('',0,'',false, '',0,'', '','01/01/1900',0,'');
  }

  createAttachmentObject(): WoAttachFilesModel {
    return new WoAttachFilesModel(0,0,'',false,0,'');
  }

  public WoData: WorkorderModel[] = [];
  private TempWoData:  WorkorderModel[] = [];

  private unsentWorkorders: WorkorderModel[] = [];
  

  public priorityCodes = [1, 2, 3, 4, 5 ];
  public woStatusCodes = ['', 'Assigned to user', 'Assigned to pool', 'Work in process', 'Completed', 'Release-incomplete'];

  public currWorkorder: WorkorderModel;

  setForceResyncWos() {
    this.forceResync = true;
  }

  setLastWoSyncDT() {
    this.lastWoSyncDT = new Date();
  }

  recentlySynced(): boolean { 
    if (this.forceResync) {
      this.forceResync = false;
      return false;
    }
    else {
      const RESYNC_WAIT_MINUTES = 1;   
      const currDT = new Date(); 
      const deltaMins = this.utilitiesSvc.getTimeDeltaMinutes(currDT, this.lastWoSyncDT);
      console.log('>> CHECK IF RECENTLY SYNCED:', deltaMins < RESYNC_WAIT_MINUTES, currDT, this.lastWoSyncDT);
      return (deltaMins < RESYNC_WAIT_MINUTES);
    }
  }

insertWoHeader(addWO: WorkorderCreateModel) {
  const newWO = this.createWorkorderObject();
  addWO.MobDispSeq = "1";
  this.utilitiesSvc.copyPropertiesObj2Obj(addWO, newWO);
  this.WoData.unshift(newWO);  // put newly created W/O at front of W/O array
  console.log('**REMOVE, insertWoHeader: WoData=>', this.WoData);
}

updateWoHeader(editWO: WorkorderEditModel): number {
  const objIdx = this.findWoInArray(editWO.WoNumber);

  this.utilitiesSvc.copyPropertiesObj2Obj(editWO, this.WoData[objIdx]);
  this.stampWoAsWIP(objIdx);
  
  //console.log('**REMOVE, updateWoHeader: WoData=>', this.WoData);
  return objIdx;
}

addUpdateWoLabor(LL: WoLaborAddEditModel, isEdit: boolean, createTC: boolean): number {
  const woNum = LL.WoNumber;
  const woIdx = this.findWoInArray(LL.WoNumber);
  this.stampWoAsWIP(woIdx);
  if (!isEdit) { // need a new line 
    const newLL = this.createLaborLineObject();
    this.utilitiesSvc.copyPropertiesObj2Obj(LL, newLL);
    newLL.MobDispSeq = newLL.MobLineId.toString();
    this.WoData[woIdx].WoLaborLines.push(newLL);
    //const objIdx = this.WoData[woIdx].WoLaborLines.length-1;
    //console.log('**REMOVE Added W/O Labor Line');
  }
  else {
    const objIdx = this.findWoLaborLine(woIdx, LL.MobLineId);
    this.utilitiesSvc.copyPropertiesObj2Obj(LL, this.WoData[woIdx].WoLaborLines[objIdx]);
  }
  //console.log('**REMOVE, addUpdateWoLabor: WoData=>', LL, this.WoData);
  return woIdx;
}

addUpdateWoTimecard(woNum: string, lbrLnIdx: number, TC: WoActualTimeModel, isEdit: boolean): number {
  const woIdx = this.findWoInArray(woNum);
  const LL = this.WoData[woIdx].WoLaborLines[lbrLnIdx];
  console.log('wordorderDataSvc.addUpdateWoTimeCard: ', woNum, lbrLnIdx, TC, isEdit);
  this.stampWoAsWIP(woIdx);
  if (!isEdit) { // need a new line 
    const newTC = this.createTimeCardObject();
    this.utilitiesSvc.copyPropertiesObj2Obj(TC, newTC);
    newTC.MobDispSeq = newTC.MobLineId.toString();
    LL.WoActualTimeLines.push(newTC);
    //console.log('**REMOVE addUpdateWoTimecard:', LL.WoActualTimeLines);
  }
  else {
    const objIdx = this.findTimecard(woIdx,lbrLnIdx,TC.MobLineId);
    this.utilitiesSvc.copyPropertiesObj2Obj(TC, LL.WoActualTimeLines[objIdx]);
  }

  // check if LL.CompletedDate is null
  //--if (LL.CompletedDateTime == "") LL.CompletedDateTime = TC.WorkDate;
  //--const currCompletedDT = new Date(LL.CompletedDateTime);
  // re-calculate TOTAL HOURS WORKED for the LABOR LINE...
  const lastIdx = LL.WoActualTimeLines.length - 1;
  let totHrs = 0;
  let biggestDate = new Date(TC.WorkDate); // default is today's date

  for (let i = 0; i<=lastIdx; i++) {
    totHrs = totHrs + LL.WoActualTimeLines[i].Hours;
    // check on Completed Date and set to TC.WorkDate if the latter is more recent
    const tcWorkDate = new Date(LL.WoActualTimeLines[i].WorkDate);
    console.log('--- checking completed date cp to workdate: ', i, tcWorkDate, biggestDate, this.utilitiesSvc.getSmallDateStr(tcWorkDate));
    if ( tcWorkDate > biggestDate ) {//
      biggestDate = tcWorkDate;
    }
  }

  this.WoData[woIdx].WoLaborLines[lbrLnIdx].AccumTime = totHrs;
  let tmpStr = biggestDate.toISOString();
  const endIdx = tmpStr.indexOf('T')+1;
  if (endIdx > -1) { 
    tmpStr = tmpStr.substring(0, endIdx)+"00:00:00";
  }
  this.WoData[woIdx].WoLaborLines[lbrLnIdx].CompletedDateTime = tmpStr;
  console.log('>>>> updating completed date -->', endIdx, this.WoData[woIdx].WoLaborLines[lbrLnIdx].CompletedDateTime );

  //console.log('**REMOVE, addUpdateWoLabor: WoData=>', TC, this.WoData);
  return woIdx;
}

deleteTimecard(woNum: string, lbrLnIdx: number, TC: WoActualTimeModel): number {
  const woIdx = this.findWoInArray(woNum);
  const objIdx = this.findTimecard(woIdx,lbrLnIdx,TC.MobLineId);
  //console.log('wordorderDataSvc.addUpdateWoTimeCard: ', woNum, lbrLnIdx, TC, objIdx, TC.Hours);
  this.WoData[woIdx].WoLaborLines[lbrLnIdx].AccumTime = this.WoData[woIdx].WoLaborLines[lbrLnIdx].AccumTime - TC.Hours;
  this.WoData[woIdx].WoLaborLines[lbrLnIdx].WoActualTimeLines.splice(objIdx, 1);

  this.stampWoAsWIP(woIdx);

  //console.log('**REMOVE, DELETE TIMECARD: WoData=>', TC, this.WoData[woIdx].WoLaborLines[lbrLnIdx].WoActualTimeLines);
  return woIdx;
}


addUpdateWoMaterial(woNum: string, ML: WoMaterialLineModel, isEdit: boolean): number {
  const woIdx = this.findWoInArray(woNum);
  this.stampWoAsWIP(woIdx);
  if (!isEdit) { // need a new line 
    //console.log('**REMOVE -1');
    const newML = this.createMaterialLineObject();
    //console.log('**REMOVE -2', newML);
    this.utilitiesSvc.copyPropertiesObj2Obj(ML, newML);
    //console.log('**REMOVE -3');
    newML.MobDispSeq = newML.MobLineId.toString();
    //console.log('**REMOVE -4');
    this.WoData[woIdx].WoMaterialLines.push(newML);
    //console.log('**REMOVE -5');
  }
  else {
    const objIdx = this.findWoMaterialLine(woIdx, ML.MobLineId);
    this.utilitiesSvc.copyPropertiesObj2Obj(ML, this.WoData[woIdx].WoMaterialLines[objIdx]);
  }
  //console.log('**REMOVE, addUpdateWoMaterial: WoData=>', ML, this.WoData);
  return woIdx;
}


addUpdateWoNote(woNum: string, Note: WoNoteModel, isEdit: boolean): number {
  const woIdx = this.findWoInArray(woNum);
  this.stampWoAsWIP(woIdx);
  if (!isEdit) { // need a new line 
    console.log('**REMOVE -1');
    const newNL = this.createNoteLineObject();
    console.log('**REMOVE -2', newNL);
    this.utilitiesSvc.copyPropertiesObj2Obj(Note, newNL);
    console.log('**REMOVE -3');
    newNL.MobDispSeq = newNL.MobLineId.toString();
    console.log('**REMOVE -4');
    this.WoData[woIdx].WoNotes.push(newNL);
    console.log('**REMOVE -5');
  }
  else {
    const objIdx = this.findWoNote(woIdx, Note.MobLineId);
    this.utilitiesSvc.copyPropertiesObj2Obj(Note, this.WoData[woIdx].WoNotes[objIdx]);
  }

  console.log('**REMOVE, addUpdateWoNote: WoData=>', this.WoData);
  return woIdx;
}

addAttachment(woNum: string, attachObj: WoAttachFilesModel): number {
  const woIdx = this.findWoInArray(woNum);
  this.stampWoAsWIP(woIdx);
  this.WoData[woIdx].WoAttachFiles.push(attachObj);
  this.utilitiesSvc.debugAlert(false, 'WorkorderDataSvc-this.WoData[woIdx].WoAttachFiles:',  
    JSON.stringify(this.WoData[woIdx].WoAttachFiles) );
  return woIdx;
}

insertWorkorder(addWO: WorkorderCreateModel) {

  const newWO = this.createWorkorderObject();
  this.utilitiesSvc.copyPropertiesObj2Obj(addWO, newWO);

  this.WoData.unshift(newWO);  

  const newLL = this.createLaborLineObject();
  

    //this.WoData[0].WoNotes.push(newWoNote);
  
  const LSOname = this.lsoRequestsSvc.workordersLSOname;
  if (!this.httpRequestsSvc.connected2Server) { // OFFLINE
    this.saveWo2LSO(0, true);
  }
  else { // ONLINE
    this.httpRequestsSvc.handlePostWorkorder(newWO)
    .subscribe( 
      (data) => {
          this.saveWo2LSO(0, false);
          this.applicVarsSvc.incrementOffLineSeqNum();
        },        
        (err) => {
          alert('ERROR: Unable to save to server!');
          this.saveWo2LSO(0, true);
        }
      )
    }
   
 }

 saveWo2LSO(woIdx: number, dirtyFlag: boolean) {
  const LSOname = this.lsoRequestsSvc.workordersLSOname; 
  //console.log('**REMOVE, test insertWorkorder, LSOname =', LSOname);
  this.WoData[woIdx].DirtyFlag = dirtyFlag;
  this.lsoRequestsSvc.storeDataInLocalStorage(this.WoData, LSOname);
  this.currWorkorder = this.WoData[0];
 }
 
  
  findStatusCode(codeStr: string): number {
    const maxIndex = this.woStatusCodes.length - 1;
    //console.log('** REMOVE - inside findStatusCode:', maxIndex, codeStr, this.woStatusCodes);
    for (let i = 0; i <= maxIndex; i++) {
      //console.log(i, '['+this.woStatusCodes[i]+']',  '['+codeStr+']',);
      if (this.woStatusCodes[i] == codeStr) return i; 
    }
    return -1;
  }
  getWoStatusChgOpts(woNum: string): any {
    const currWo = this.getWorkorder(woNum);
    const currStatus = currWo.WoMobStatusId;
    var changeStatusOpts: Array<number>;

    //if (currWo.UrgentFlag) return [2]; // POOL //#197
    // ELSE...

//public woStatusCodes = ['', 'Assigned to user', 'Assigned to pool', 'In-process', 'Completed', 'Release-Incomplete'];
    switch(currStatus) {
      case 1: { // Assigned to User
        //changeStatusOpts = [  2, 3 ]; break;
        if (currWo.UrgentFlag) changeStatusOpts = [  5 ];
        else changeStatusOpts = [  3 ]; break; // Req#195
      } 
      case 2: { //  Assigned to Pool
        changeStatusOpts = [  1, 3 ]; break;
      } 
      case 3: { // WIP
        const woIsActive = this.checkWo4ResourcesUsed(woNum);
        // not checking for activity as of 2019-05-15
        // if ( woIsActive) changeStatusOpts = [ 4, 5 ]; //'Incomplete'];
        // else  changeStatusOpts = [ 1, 2 ];
        if (currWo.UrgentFlag) changeStatusOpts = [  5 ];
        else changeStatusOpts = [ 4, 5 ];
        break; 
      } 
      case 4: { changeStatusOpts = [3, 5]; break; } // no change allowed

      case 5: { changeStatusOpts = [3, 4]; break; }
    }
    //console.log('>STATUS change options for WO# '+woNum, changeStatusOpts);
    //for (let statVal of changeStatusOpts) console.log(statVal, '['+statVal+']');
    return changeStatusOpts;
  }

  getIdxFromMobLineId(lineId: number, arrObj: Array<any>): number {
    const lastIdx = arrObj.length -1;
    //console.log('lastIdx', lastIdx);
    for (var i = 0; i <= lastIdx; i++) {
      //console.log('compare: ',i, lineId, arrObj[i].MobLineId );
      if (arrObj[i].MobLineId == lineId) {
        //console.log('MATCHED: ',i, lineId, arrObj[i].MobLineId );
        return i;
      }
    }
    return -1;
  }

  findNextMobLineId(arrObj: Array<any>): number {
    const lastIdx = arrObj.length - 1;

    if ( lastIdx < 0 ) return 1
    else {
      let largestId = 0;
      for (let i = 0; i <= lastIdx; i++) {
        if (arrObj[i].MobLineId > largestId) { largestId = arrObj[i].MobLineId }
        //console.log('**REMOVE: findNextMobLineId (2) ==> ', arrObj[i].MobLineId, largestId);
      }
      return largestId+1;
    }
  }

getWoDataObj(): WorkorderModel[] {
  return this.WoData;
}

fixWoDataProblems(woIdx) {
  const noteArr = this.WoData[woIdx].WoNotes;
  const lastIdx = noteArr.length - 1;
  for (let i = 0; i <= lastIdx; i++) {
    if (noteArr[i].CreatedDateTime === "") noteArr[i].CreatedDateTime = this.utilitiesSvc.getCurrDateStr();
  }
}
getWorkordersFromLS() {
  return new Promise((resolve, reject)=>{
    
  this.myLoader1.present("Retrieving Work Orders offline...");
  if (this.utilitiesSvc.debugIssue('*')) console.log('wo-data-svc.getWorkordersFromLS()', this.lsoRequestsSvc.workordersLSOname);
  this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workordersLSOname)
  .then ((woData)=> {  
    this.WoData.length = 0;
    for ( let wo in woData ) {
      this.currWorkorder = woData[wo];
      this.WoData.push(this.currWorkorder);
    }   
      this.myLoader1.dismiss();
      resolve(this.WoData); 
      return;
  }
    ,(error)=> {
       this.myLoader1.dismiss();
       alert('Error retrieving W/O data from Local Storage'); reject([]); }
   ); 
  });

}
getAllWorkorders() {
  return new Promise((resolve, reject)=>{
    this.doneResync = false;
    console.log('[* 1 *]');
    
    this.myLoader1.present("Checking work orders to sync...");
    //console.log('##1-0 just began service function: getAllWorkorders');
  //console.log('##2-04 wo-data-svc getAllWorkorders()', this.lsoRequestsSvc.workordersLSOname);
    this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workordersLSOname)
    .then ((woData)=> {  
      this.WoData.length = 0;
      for ( let wo in woData ) {
        this.currWorkorder = woData[wo];
        this.WoData.push(this.currWorkorder);
      }  
      //console.log('##1-1 - Popd WoData from LSO', this.WoData);
      if ( !this.httpRequestsSvc.connected2Server || this.recentlySynced()) {  //#140
        //console.log('##1-2 NOT USING HTTP to pull back WoData');
        resolve(this.WoData);  
        this.myLoader1.dismiss();
        return;
      } 
      // else ...deviceIsOnline

      // FIRST, check for any work orders needing to be sync'd ...
      this.need2SyncWOs = [];
      this.unsentWorkorders.length = 0;
      for (let woIdx = 0; woIdx < this.WoData.length; woIdx++) {
        if (this.WoData[woIdx].DirtyFlag) {
          this.need2SyncWOs.push(woIdx);
          this.unsentWorkorders.push(this.WoData[woIdx]);
          //console.log('##1-3 found a Dirty WO: ', this.need2SyncWOs, this.unsentWorkorders);
          this.utilitiesSvc.debugAlert(false,'found W/O needing to be sent 2 server ...', this.WoData[woIdx].WoNumber);
        }
      }
      const numDirtyWos = this.need2SyncWOs.length;

      // SECOND, check for any images needing to be sent to the server ...
      this.need2SyncImages = [];
      this.lsoRequestsSvc.getDataFromLocalStorage('attachments')
      .then ((data)=>{ // got attachments data from LSO
        if (!data) { this.attachments = [] }
        else this.attachments = data;
        //console.log('##1-4 after retrieving attachments from LSO =>', this.attachments);
        //console.log('**REMOVE: CHECKING for images needing to be sent 2 server ...', this.attachments);
        //alert('**REMOVE - attachments from LSO: '+ JSON.stringify(this.attachments)); 
        for (let attIdx = 0; attIdx < this.attachments.length; attIdx++) {
          if (this.attachments[attIdx].Need2Send2Server) {
            this.need2SyncImages.push(attIdx);
            this.utilitiesSvc.debugAlert(false,'found image needing to be sent 2 server ...', this.attachments[attIdx].WoNumber);
          }
        }
        
        // THIRD, send any W/Os flagged as "dirty" to the server ...
        if (this.need2SyncWOs.length > 0 || this.need2SyncImages.length > 0) {
          this.doneResync = false; // this is used by setTimeout loop below that waits until sync dirty is done requesting list of w/o's from server
          //console.log('##1-35 doneResync', this.doneResync);
          this.woSubscriptionSvc.execTriggerSaveNextWo(0); 
        }  
        else {
          this.myLoader1.present("Retrieving work orders from server...");
          this.doneResync = true;
          //console.log('##1-36 doneResync', this.doneResync);
        }
        
      }// then ((attachments)
      ,(error)=> {
        //console.log('##1-5 error reading LSO: No Attachments found');
        alert('Error retrieving Attachments from Local Storage'); return []; } ); // got attachments data from LSO
      } // then ((woData)
    
    ,(error)=> {
        //console.log('##1-6 error reading LSO: No WoData found');
        alert('Error retrieving W/O data from Local Storage'); return []; 
      }
    );

    let cntr = 0;
    let timerId = setInterval(()=> 
      { cntr++; 
        if (this.utilitiesSvc.debugIssue('*')) console.log('**Tick:',cntr, "doneResync==>", this.doneResync);
        if (this.doneResync) {
          this.doneResync = false; // do not allow this to be executed a 2nd time
          clearInterval(timerId);
          if (this.utilitiesSvc.debugIssue('*')) console.log('OK2GET WO FROM SERVER!!!!!');
          let url = this.applicVarsSvc.getApiRootUrl() + 'workorder'; 
          this.httpRequestsSvc.handleGetRequest(url, true)
          .subscribe( 
            <WorkorderModel>(data) => {
              if (this.utilitiesSvc.debugIssue('*')) console.log('After GetRequest workorder', data);
              this.setLastWoSyncDT(); //#140
              this.processWOsFromServer(data);
              this.lsoRequestsSvc.storeObj2Lso(this.WoData, this.lsoRequestsSvc.workordersLSOname)
                .then ((success)=> {
                  //this.myLoader1.dismiss();
                  resolve(this.WoData) 
                }, // (success) {} (after storing in LS)
               (error)=> {
                  this.myLoader1.dismiss();
                  alert('Error: could not save WO to local storage');
                }
              ) // end of .then (storing LSO)
            },        
            (err) => { 
              this.myLoader1.dismiss(); 
              alert('Error retrieving W/Os from server: '+JSON.stringify(err))      
            }
          ) 
        }    
      }, 1000);
    //after 30 secs stop
    const maxTimeout = 10000; 
    setTimeout(()=>{clearInterval(timerId); 
      //console.log('##1-24 Clear Interval Timer',  JSON.stringify(new Date()));
      this.utilitiesSvc.debugAlert(false,'Ended timer', JSON.stringify(new Date()))}, maxTimeout);
    })
  }

  processWOsFromServer(data: WorkorderModel[]) {     
    if (this.WoData.length > 0) {    /* **REMOVE - TEMP TESTING ONLY  **/
      //this.WoData[1].DirtyFlag = true;
      //this.WoData[7].DirtyFlag = true;
    }
   
    var dirtyWoNums: Array<string> = [];
    this.WoData.length = 0; // erase contents of previous W/O List
    this.TempWoData.length = 0; // erase contents of previous temp list of WOs
    

    //Add dirty W/Os to top of new list
    for ( let wo in this.unsentWorkorders ) {
      if (this.utilitiesSvc.debugIssue('1906-20')) console.log('Save Dirty W/Os ==>', this.unsentWorkorders[wo]);
      this.TempWoData.push(this.unsentWorkorders[wo]);
      dirtyWoNums.push(this.unsentWorkorders[wo].WoNumber);
    }

    //Now add W/Os (not the dirty ones) to the new list - those assigned to me or WIP at top oflist

    for ( let wo in data ) {
      this.currWorkorder = data[wo];
      //if (this.utilitiesSvc.debugIssue('1906-20')) console.log('Processing W/O recd from server: ', this.currWorkorder.WoNumber);
      if ( (this.currWorkorder.WoMobStatusId == 1) || (this.currWorkorder.WoMobStatusId == 3) ){
        const dirtyWoIdx = dirtyWoNums.indexOf(this.currWorkorder.WoNumber);
        if (dirtyWoNums.indexOf(this.currWorkorder.WoNumber) == -1) { // does not correspond to a dirty W/O in previous w/o list
          this.fixWoDatesFromSqlServer(this.currWorkorder);
          this.TempWoData.push(this.currWorkorder);
        }
      }          
    }
    // 2nd, add w/o's to wo-array which have status == 2 (pool)
    for ( let wo in data ) {
      this.currWorkorder = data[wo];
      if ( (this.currWorkorder.WoMobStatusId == 2) ){
        const dirtyWoIdx = dirtyWoNums.indexOf(this.currWorkorder.WoNumber);
        if (dirtyWoNums.indexOf(this.currWorkorder.WoNumber) == -1) { // does not correspond to a dirty W/O in previous w/o list
          this.fixWoDatesFromSqlServer(this.currWorkorder);
          this.TempWoData.push(this.currWorkorder);
        }
      }          
    }

    // 3rd, add w/o's to wo-array which have status in (4,5) 
    for ( let wo in data ) {
      this.currWorkorder = data[wo];
      if ( (this.currWorkorder.WoMobStatusId > 3) ){
        const dirtyWoIdx = dirtyWoNums.indexOf(this.currWorkorder.WoNumber);
        if (dirtyWoNums.indexOf(this.currWorkorder.WoNumber) == -1) { // does not correspond to a dirty W/O in previous w/o list
          this.fixWoDatesFromSqlServer(this.currWorkorder);
          this.TempWoData.push(this.currWorkorder);
        }
      }          
    }
    this.WoData = this.TempWoData.slice();
    if (this.utilitiesSvc.debugIssue('1906-20')) console.log('after processing all WOs: ', this.TempWoData, this.WoData);

  }
 
  fixWoDatesFromSqlServer(wo:WorkorderModel) {
    //console.log('FIXworkorderDates',wo.WoNumber);
    // fix W/O Header dates...
    wo.StartDate = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.StartDate);
    wo.DateRequired = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.DateRequired);
    wo.CompletedDate = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.CompletedDate);
    wo.AssignedDate = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.AssignedDate);
    wo.ModifiedDate = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.ModifiedDate);
    wo.DTAssignmentChanged = this.utilitiesSvc.fixSqlIso8601DateTimeStr(wo.DTAssignmentChanged);

    let idx=0;
    // fix W/O Labor Line dates...
    for ( let L of wo.WoLaborLines ) {
      wo.WoLaborLines[idx].StartDateTime = this.utilitiesSvc.fixSqlIso8601DateTimeStr(L.StartDateTime);
      wo.WoLaborLines[idx].CompletedDateTime = this.utilitiesSvc.fixSqlIso8601DateTimeStr(L.CompletedDateTime);

      // fix W/O Labor/Timecard dates...
      let idx2 = 0;
      for ( let T of L.WoActualTimeLines ) {
        wo.WoLaborLines[idx].WoActualTimeLines[idx2].WorkDate = 
          this.utilitiesSvc.fixSqlIso8601DateTimeStr(T.WorkDate);      
        idx2++;
      }
      idx++;
    }
     // fix W/O Material dates...
     idx = 0;
     for ( let L of wo.WoMaterialLines ) {
       wo.WoMaterialLines[idx].UsageDate = this.utilitiesSvc.fixSqlIso8601DateTimeStr(L.UsageDate);
      idx++;
     }
  }  

  unfixWoDates(wo: WorkorderModel) {
    ////console.log('>>UNFIX W/O DATES #1', wo, this.currWorkorder);
    // fix W/O Header dates...
    wo.StartDate = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.StartDate);
    wo.DateRequired = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.DateRequired);
    wo.CompletedDate = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.CompletedDate);
    wo.AssignedDate = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.AssignedDate);
    wo.ModifiedDate = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.ModifiedDate);
    wo.DTAssignmentChanged = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(wo.DTAssignmentChanged);

    //console.log('>>UNFIX W/O DATES #2');
    let idx=0;
    // fix W/O Labor Line dates...
    for ( let L of wo.WoLaborLines ) {
      L.StartDateTime = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(L.StartDateTime);
      L.CompletedDateTime = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(L.CompletedDateTime);

      // fix W/O Labor/Timecard dates...
      let idx2 = 0;
      for ( let T of L.WoActualTimeLines ) {
        T.WorkDate = 
          this.utilitiesSvc.unFixSqlIso8601DateTimeStr(T.WorkDate);  
      }
      idx++;
    }
     // fix W/O Material dates...
    //console.log('>>UNFIX W/O DATES #3');
     for ( let L of wo.WoMaterialLines ) {
       L.UsageDate = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(L.UsageDate);
     }
     //console.log('>>UNFIX W/O DATES #4');

  // fix W/O Note Created dates...
     for ( let NE of wo.WoNotes ) {
      NE.CreatedDateTime = this.utilitiesSvc.unFixSqlIso8601DateTimeStr(NE.CreatedDateTime);
     }
  }

  findWoInArray2(woArr: WorkorderModel[], woNum: string): number {
    let maxWoIndex = woArr.length - 1;
    for (let i = 0; i <= maxWoIndex; i++) {
      if (woArr[i].WoNumber == woNum) return i; 
    }
    return -1; 
  }

  findWoInArray(woNum: string): number {
    let maxWoIndex = this.WoData.length - 1;
    for (let i = 0; i <= maxWoIndex; i++) {
      if (this.WoData[i].WoNumber == woNum) return i; 
    }
    return -1; 
  }

   getWorkorder(woNum: string): WorkorderModel {
    const woIdx = this.findWoInArray(woNum);
    //console.log('getWorkorder: woNum/woIdx =>', woNum, woIdx);
    this.currWorkorder = this.WoData[woIdx];
    //console.log('getWorkorder: currWorkorder =>', this.currWorkorder);
    return this.WoData[woIdx];	 
  }  

  setCurrWo(woNum: string) {
    const woIdx = this.findWoInArray(woNum);
    //console.log('setCurrWo: woNum/woIdx =>', woNum, woIdx);
    this.currWorkorder = this.WoData[woIdx];
    console.log('getWorkorder: currWorkorder =>', this.currWorkorder);
    return 
    }

  getCurrWO() {
    return this.currWorkorder;	 
  }
  
  getCurrWoNumNotes():number {
    if (this.currWorkorder) {
      return this.currWorkorder.WoNotes.length;
    }
    else return 0;
  }

  getCurrWoNumAttachments():number {
    if (this.currWorkorder) {
      return this.currWorkorder.WoAttachFiles.length;
    }
    else return 0;
  }

  private findWoLaborLine(woIndex: number, lineId: number): number {
    let maxIndex = this.WoData[woIndex].WoLaborLines.length - 1;
    for (let i = 0; i <= maxIndex; i++) {
      if (this.WoData[woIndex].WoLaborLines[i].MobLineId == lineId) return i; 
    }
    return -1;
  }

  private insertNewLaborLine (woIndex: number): number {
    const newLaborLine = new WoLaborLineModel('',0,'','',0,0,0,'','','','',[],0,'',false);
    this.WoData[woIndex].WoLaborLines.push (newLaborLine);
    //console.log('insertNewLaborLine', this.WoData[woIndex].WoLaborLines.length - 1, newLaborLine);
    return this.WoData[woIndex].WoLaborLines.length - 1;
  }

  private findTimecard(woIndex: number, LLidx: number, lineId: number): number {
    let maxIndex = this.WoData[woIndex].WoLaborLines[LLidx].WoActualTimeLines.length - 1;
    for (let i = 0; i <= maxIndex; i++) {
      if (this.WoData[woIndex].WoLaborLines[LLidx].WoActualTimeLines[i].MobLineId == lineId) return i; 
    }
    return -1;
  }

  private findNextTimecardId(woIndex: number, laborLineId: number): number {    
    return this.WoData[woIndex].WoLaborLines[laborLineId].WoActualTimeLines.length + 1;
  }

  private insertNewTimecard (woIndex: number, laborLineIdx: number): number { 
    const newTimeCareLine = new WoActualTimeModel('','','01/01/1900','','','',0,0,'',false);
    const timeCards = this.WoData[woIndex].WoLaborLines[laborLineIdx].WoActualTimeLines
    timeCards.push (newTimeCareLine);
    const tcIdx =  timeCards.length -1;
    //console.log('insertNewLaborLine ==>', tcIdx,timeCards[tcIdx]);
    return tcIdx;
  }

  private findWoMaterialLine(woIndex: number, lineId: number): number {
    let maxIndex = this.WoData[woIndex].WoMaterialLines.length - 1;
    //console.log('**REMOVE: maxIndex=', maxIndex);
    for (let i = 0; i <= maxIndex; i++) {
      //console.log('**REMOVE: compare', lineId, this.WoData[woIndex].WoMaterialLines[i].MobLineId);
      if (this.WoData[woIndex].WoMaterialLines[i].MobLineId == lineId) return i; 
    }
    //console.log('**REMOVE: DID NOT FIND MATLINEID:', lineId);
    return -1;
  }

  private findNextMaterialLineId(woIndex: number): number {   
    const objArray = this.WoData[woIndex].WoMaterialLines;
    var lastLineId = 0;
    for (var lineItem of objArray) {
      if (lineItem.MobLineId > lastLineId) { lastLineId = lineItem.MobLineId}
    }  
    return lastLineId + 1; 
  }

  private insertNewMaterialLine (woIndex: number): number {
    /*     
    const newLaborLine = new WoLaborLineModel('',0,'','',0,0,0,'','','','',[],0,'',false);
    this.WoData[woIndex].WoLaborLines.push (newLaborLine);*/
    const newMaterialLine = 
      new WoMaterialLineModel('','','',0, 0,0,0,'','',  '','','','','',  '','','','','',  0,'',0,'',false,  0);
    this.WoData[woIndex].WoMaterialLines.push (newMaterialLine);
    //console.log('insertNewMaterialLine', this.WoData[woIndex].WoMaterialLines.length - 1, newMaterialLine);
    return this.WoData[woIndex].WoMaterialLines.length - 1;
  }

  private findWoNote(woIndex: number, lineId: number): number {
    const maxIndex = this.WoData[woIndex].WoNotes.length - 1;
    for (let i = 0; i <= maxIndex; i++) {
      if (this.WoData[woIndex].WoNotes[i].MobLineId == lineId) return i; 
    }
    return -1;
  }

  private findNextWoNoteId(woIndex: number): number {  
    const objArray = this.WoData[woIndex].WoMaterialLines;
    var lastLineId = 0;
    for (var lineItem of objArray) {
      if (lineItem.MobLineId > lastLineId) { lastLineId = lineItem.MobLineId}
    }  
    return lastLineId + 1; 
  }

  private insertNewWoNote (woIndex: number): number {
    const newWoNote = new WoNoteModel('',0,'',false, '',0,'', '','01/01/1900',0,'');
    newWoNote.UserId = this.applicVarsSvc.getLoginUserId();
    newWoNote.CreatedDateTime = this.utilitiesSvc.getCurrDateStr();
    this.WoData[woIndex].WoNotes.push (newWoNote);
    //console.log('insertNewNote', this.WoData[woIndex].WoNotes.length - 1, newWoNote);
    return this.WoData[woIndex].WoNotes.length - 1;
  }

  getNextMobDispSeq(woIdx: number): string {
    const myMobDevUserId = this.WoData[woIdx].MobDevUserId;
    console.log('**>> getNextMobDispSeq: target wo idx=>', woIdx, myMobDevUserId);
    let largestDispSeqNum = 0;
    const endIdx = this.WoData.length;
    for ( let i = 0; i < endIdx; i++) {
      // check only wo's that are not the one being modified or belong to this MobDevUserId
      if (this.WoData[i].MobDevUserId == myMobDevUserId && i != woIdx)
      {
        const dispSeqNum = Number(this.WoData[i].MobDispSeq);
        if (dispSeqNum > largestDispSeqNum) largestDispSeqNum = dispSeqNum;
        else if (dispSeqNum <= i) largestDispSeqNum = i;
        //console.log('**>> getNextMobDispSeq-2', i, 
          //this.WoData[i].MobDispSeq, dispSeqNum, this.WoData[i].MobDevUserId );
      }
    }
    return Number(largestDispSeqNum+1).toString();
  }

  stampWoAsWIP(woIdx: number) {
    //console.log('MOBILE STATUS ==>', this.WoData[woIdx].WoMobStatusId );
    this.WoData[woIdx].DirtyFlag = true;
    this.WoData[woIdx].MobDevUserId = this.applicVarsSvc.getMobDevUserId();    
    this.WoData[woIdx].AssignedToUserId = this.applicVarsSvc.getLoginUserId(); 
    const dispSeqStr = this.WoData[woIdx].MobDispSeq;
    if (!dispSeqStr || dispSeqStr === "" )  
      this.WoData[woIdx].MobDispSeq = this.getNextMobDispSeq(woIdx);
    if (this.WoData[woIdx].WoMobStatusId == 4) {
      this.WoData[woIdx].WoMobStatusDesc = 'Complete'; // Complete
    } 
    else  
    if (this.WoData[woIdx].WoMobStatusId == 5) {
      this.WoData[woIdx].WoMobStatusDesc = 'Incomplete'; // Incomplete
    } 
    else 
    if (this.WoData[woIdx].WoMobStatusId !== 2) { // do not change pool
      this.WoData[woIdx].WoMobStatusId = 3; // WIP
      this.WoData[woIdx].WoMobStatusDesc = 'Work in Progress'; // WIP
    }

    this.currWorkorder = this.WoData[woIdx];
  }

  ok2EditWo(woStatus: number) {
    return (woStatus == 1 || woStatus ==3);  
  }

  checkWo4ResourcesUsed(woNum: string): boolean {
    const woIdx = this.findWoInArray(woNum);
    const maxLabIdx = this.WoData[woIdx].WoLaborLines.length - 1;
    for (let i = 0; i <= maxLabIdx; i++) {      
      //console.log('**REMOVE checkWo4ResourcesUsed: ',this.WoData[woIdx].WoLaborLines[i].CompletedDateTime );
      if ( (this.WoData[woIdx].WoLaborLines[i].WoActualTimeLines.length > 0)
          || (this.WoData[woIdx].WoLaborLines[i].CompletedDateTime !== '') ) {
        return true; 
      }
    }
    const maxMatIdx = this.WoData[woIdx].WoMaterialLines.length - 1;
    for (let i = 0; i <= maxMatIdx; i++) {
      if (this.WoData[woIdx].WoMaterialLines[i].QtyUsed > 0) {
        return true; 
      }
    }
    return false;
  }



  ngOnDestroy() {
    this.triggerSaveNextWoSubscription.unsubscribe();
    this.triggerSaveNextImageSubscription.unsubscribe();
    
  }
}


