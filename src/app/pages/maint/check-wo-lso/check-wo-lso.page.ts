import { Component, OnInit } from '@angular/core';

import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";

import { Storage } from '@ionic/storage';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { LoadingService } from '../../../services/loading.service';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models

//Pages
import { WorkorderModel, WorkorderCreateModel, WorkorderEditModel } from '../../../models/workorder-model';
import { WoLaborLineModel, WoLaborAddEditModel } from '../../../models/wo-labor-line-model';
import { WoActualTimeModel } from '../../../models/wo-actual-time-model';
import { WoMaterialLineModel } from '../../../models/wo-material-line-model';
import { WoNoteModel } from '../../../models/wo-note-model';
import { AttachFilesLsoModel } from '../../../models/wo-attach-files-model';

//Data

import { environment } from '../../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-check-wo-lso',
  templateUrl: './check-wo-lso.page.html',
  styleUrls: ['./check-wo-lso.page.scss'],
})
export class CheckWoLsoPage implements OnInit {

  //component data
  private PageTitle: string = 'Check Work Orders';

  //presentation data

  //processing data
  private workorderList: WorkorderModel[] = [];

  constructor(
    private menuCtrl: MenuController,
    private viewCtrl: ModalController,
    private navCtrl: NavController,
    private actionSheetController: ActionSheetController, 
    private alertCtrl: AlertController,
    private storage: Storage,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc) {

     }

  //presentation data
  private pageFormGroup: FormGroup;
  private formHasChanged = false;

  //processing data
  private check4DupsResultStr: string = "";
  private check4MissingDevUserIdStr: string = "";

  closePage() {
    console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }



  async presentAlert() {
    const fV=this.pageFormGroup.value;
    let msg='';
    if (fV.fixDupMLIs) msg = 'fix duplicate MobLineId(s)';
    console.log('fixMissingDevUserIds =>', fV.fixMissingDevUserIds);
    if (fV.fixMissingDevUserIds) 
      if (msg.length>0) msg = msg+' and fix missing MobDevUserId(s)';
      else msg='fix missing MobDevUserId(s)';
    msg = this.utilitiesSvc.removeLeadingTrailingSpaces(msg);
    if (msg == '') {
      alert("You haven't selected anything!");
      return;
    }
    
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm you wish to '+msg+' data',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 
           
            var clearedSomething = false;
            this.myLoader.present('Fixing Work Orders ...');

            var fix1 = false;
            if (fV.fixDupMLIs) {
              fix1 = this.findFixDupMobLineIds(true);
            }
            var fix2 = false;
            if (fV.fixMissingDevUserIds) {
              fix2 = this.findFixMobDevUserId(true);
            }
            clearedSomething = fix1 || fix2;

            if (clearedSomething) this.connectionSvc.chgLoginState(false);
            this.myLoader.dismiss();
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


  checkDupMobLineIds(arrObj: Array<any>): Array<{MobLineId:number, arrIdx: number}> {
    var idArr: Array<number> = [];
    var resultArr: Array<{MobLineId:number, arrIdx: number}> = [];
    //console.log('Check arr-obj: ', arrObj);
    const lastIdx = arrObj.length - 1;
    for (let i = 0; i <= lastIdx; i++) {
      const isDup = (idArr.length>0 && idArr.indexOf(arrObj[i].MobLineId)>-1); //i.e., this MobLineId already exists  
      idArr.push(arrObj[i].MobLineId);
      if (isDup) {
        resultArr.push({MobLineId: arrObj[i].MobLineId, arrIdx: i}); 
        alert('Found dup: '+JSON.stringify(arrObj));
        console.log('individual element check: ', i, arrObj[i].MobLineId, idArr, idArr.indexOf(arrObj[i].MobLineId), arrObj);
      } 
    }
    return resultArr;
  }

  makeDupErrorMsg(arrDups: Array<{MobLineId:number, arrIdx: number}> ): string {
    var resultStr = '';
    const lastIdx = arrDups.length - 1;
    for (let i = 0; i <= lastIdx; i++) {
      resultStr = resultStr + ' index='+arrDups[i].arrIdx.toString()+', MobLineId='+arrDups[i].MobLineId+'\n';
    }
    return resultStr;
  }

  

  fixDupMobLineId(woIdx:number, arrDups: Array<{MobLineId:number, arrIdx: number}>, arrObj: Array<any>): string {   
    var rtnStr = "";
    const lastIdx = arrDups.length - 1;
    for (let i = 0; i <= lastIdx; i++) {    
      const idx = arrDups[i].arrIdx;  
      const nextMLI = this.workorderDataSvc.findNextMobLineId(arrObj);
      const dupMLI = arrObj[idx].MobLineId;
      //console.log('**REMOVE !!! FIX MLI - dup was:',dupMLI, ' changed to:', nextMLI);
      rtnStr = " ** Fixed duplicate MobLineId, changed from: "+dupMLI.toString()+', to '+nextMLI.toString()+'\n';
      arrObj[idx].MobLineId = nextMLI;
      this.workorderList[woIdx].DirtyFlag = true; 
    }
    return rtnStr;
  }

  findFixDupMobLineIds(fix: boolean): boolean {
    var tmpStr = "";  this.check4DupsResultStr = "";
    var arrDups: Array<{MobLineId: number, arrIdx: number}> = [];
    const lastWoIdx = this.workorderList.length-1;
    for (let woIdx=0; woIdx <= lastWoIdx; woIdx++) {
      const WO = this.workorderList[woIdx];

      
      // LABOR LINES...
      arrDups = this.checkDupMobLineIds(WO.WoLaborLines);
      tmpStr = this.makeDupErrorMsg(arrDups);
      if (tmpStr.length > 0) {
        this.check4DupsResultStr = this.check4DupsResultStr + 
          'W/O# '+WO.WoNumber+' has dups on Labor Line(s):\n'+tmpStr;
      }
      const lastLbrIdx = WO.WoLaborLines.length-1;
      for (let lbrIdx=0; lbrIdx < lastLbrIdx; lbrIdx++) {
        const LL = WO.WoLaborLines[lbrIdx];


        // TIME CARDS...
        arrDups = this.checkDupMobLineIds(LL.WoActualTimeLines);
        tmpStr = this.makeDupErrorMsg(arrDups);
        if (tmpStr.length > 0) {
          this.check4DupsResultStr = this.check4DupsResultStr + 
            'W/O# '+WO.WoNumber+' has M/L dups on Time Cards\n for Labor Line '+
            'Index: '+lbrIdx.toString()+' M/L: '+LL.MobLineId.toString() +':\n'+tmpStr;
          if (fix) {
            this.check4DupsResultStr = this.check4DupsResultStr + 
              this.fixDupMobLineId(woIdx, arrDups, LL.WoActualTimeLines);
          }
        }
        const lastTCIdx = WO.WoLaborLines.length-1;
        for (let TCidx=0; TCidx < lastTCIdx; TCidx++) {
          const TC = LL.WoActualTimeLines[TCidx];
        }
      }

      
      // MATERIAL...
      arrDups = this.checkDupMobLineIds(WO.WoMaterialLines);
      tmpStr = this.makeDupErrorMsg(arrDups);
      if (tmpStr.length > 0) {
        this.check4DupsResultStr = this.check4DupsResultStr + 
          'W/O# '+WO.WoNumber+' has M/L dups on Mat Line(s):\n'+tmpStr;
        if (fix) {
          this.check4DupsResultStr = this.check4DupsResultStr + 
            this.fixDupMobLineId(woIdx, arrDups, WO.WoMaterialLines);
        }
      }
      const lastMtlIdx = WO.WoMaterialLines.length-1;
      for (let mtlIdx; mtlIdx < lastMtlIdx; mtlIdx++) {
        const ML = WO.WoMaterialLines[mtlIdx];
      }

      // NOTES...
      arrDups = this.checkDupMobLineIds(WO.WoNotes);
      tmpStr = this.makeDupErrorMsg(arrDups);
      if (tmpStr.length > 0) {
        this.check4DupsResultStr = this.check4DupsResultStr + 
          'W/O# '+WO.WoNumber+' has M/L dups on Note(s):\n'+tmpStr;
          if (fix) {
            this.check4DupsResultStr = this.check4DupsResultStr + 
              this.fixDupMobLineId(woIdx, arrDups, WO.WoNotes);
          }
      }
      const lastNoteIdx = WO.WoNotes.length-1;
      for (let NoteIdx = 0; NoteIdx < lastNoteIdx; NoteIdx++) {
        const NL = WO.WoNotes[NoteIdx];
      } 

      // ATTACHMENTS...
      arrDups = this.checkDupMobLineIds(WO.WoAttachFiles);
      //console.log('ATTACHMTS: arrDups:', arrDups);
      tmpStr = this.makeDupErrorMsg(arrDups);
      if (tmpStr.length > 0) {
        this.check4DupsResultStr = this.check4DupsResultStr + 
          'W/O# '+WO.WoNumber+' has M/L dups on Attachment(s):\n'+tmpStr;
          if (fix) {
            this.check4DupsResultStr = this.check4DupsResultStr + 
              this.fixDupMobLineId(woIdx, arrDups, WO.WoAttachFiles);
          }
      }
      const lastAttIdx = WO.WoAttachFiles.length-1;
      for (let attIdx = 0; attIdx < lastAttIdx; attIdx++) {
        const ATT = WO.WoAttachFiles[attIdx];
      }
    }

    this.pageFormGroup.get('dupCheckText').setValue(this.check4DupsResultStr);
    if (this.check4DupsResultStr.length==0) this.check4DupsResultStr="** No Duplicate MobLineId's found";
    else {
      this.check4DupsResultStr="The following Duplicate MobLineId's were found:\n"
      + this.check4DupsResultStr;
      this.lsoRequestsSvc.storeObj2Lso(this.workorderList, this.lsoRequestsSvc.workordersLSOname);
      }
    return (this.check4DupsResultStr.length>0)
  }


  findFixMobDevUserId(fix: boolean): boolean {
    this.check4MissingDevUserIdStr = "";
    const lastWoIdx = this.workorderList.length-1;
    for (let woIdx=0; woIdx <= lastWoIdx; woIdx++) {
      const WO = this.workorderList[woIdx];
      console.log('CHECKING MISSING MOBDEVUSERID - WO#', WO.WoNumber, WO.MobDevUserId);
      if ( (WO.WoMobStatusId !==2 ) && (!WO.MobDevUserId || WO.MobDevUserId < 0 ) ) {
        this.check4MissingDevUserIdStr = this.check4MissingDevUserIdStr + 
          'W/O# '+WO.WoNumber+' is missing MobDevUserId\n';
        if (fix) {
          console.log('**FIXING MISSING MOBDEVUSERID - WO#', WO.WoNumber, WO.MobDevUserId, this.applicVarsSvc.getMobDevUserId());
          WO.MobDevUserId = this.applicVarsSvc.getMobDevUserId();
          this.check4MissingDevUserIdStr = this.check4MissingDevUserIdStr + 
          '** Fixed - MobDevUserId set to: '+this.applicVarsSvc.getMobDevUserId().toString()+'\n';
          this.workorderList[woIdx].DirtyFlag = true; 
        }
      }
    }

    this.pageFormGroup.get('missingDevUserIdText').setValue(this.check4MissingDevUserIdStr);
    if (this.check4MissingDevUserIdStr.length==0) this.check4DupsResultStr="** No Missing MobDevUserId's found";
    else {
      this.check4MissingDevUserIdStr="The following Missing MobDevUserId's were found:\n"
      + this.check4MissingDevUserIdStr;
      this.lsoRequestsSvc.storeObj2Lso(this.workorderList, this.lsoRequestsSvc.workordersLSOname);
      }
    return (this.check4MissingDevUserIdStr.length>0)
  }

      

  ionViewDidEnter() {
    //this.workorderList[2].MobDevUserId = -1; //**REMOVE - TESTING ONLY */
    //this.workorderList[0].WoLaborLines[0].WoActualTimeLines[2].MobLineId = 2;
    console.log('**** this.applicVarsSvc.getMobDevUserId() -->', this.applicVarsSvc.getMobDevUserId());
    this.findFixDupMobLineIds(false); 
    this.findFixMobDevUserId(false); 
  }

  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'fixDupMLIs': new FormControl(false,[Validators.required]),
      'dupCheckText': new FormControl(''),
      'fixMissingDevUserIds': new FormControl(false,[Validators.required]),
      'missingDevUserIdText': new FormControl(''),
    });
    //console.log("**REMOVE - workordersLSOname", this.lsoRequestsSvc.workordersLSOname);

    if (this.lsoRequestsSvc.workordersLSOname =="") {
      alert('You must first be logged on to perform this check');
      this.closePage();
    }
    
  this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workordersLSOname)
  .then ((woData)=> {  
    this.workorderList.length = 0;
    for ( let wo in woData ) {
      const currWo = woData[wo];
      this.workorderList.push(currWo);
      
    }  
  } );
  


    this.pageFormGroup.valueChanges
    .subscribe( (value )=> {
      this.formHasChanged = true;
    } );

    this.pageFormGroup.get('fixDupMLIs').valueChanges
    .subscribe( (value )=> {

      //console.log('this.pageFormGroup.get(fixDupMLIs).value ==>', this.pageFormGroup.get('fixDupMLIs').value);
      //this.pageFormGroup.get('clearWorkorders').setValue(value);      
    } );
  
  }

}
