import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IonicModule, MenuController, NavController, NavParams,
    ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";

//Services
import { UtilitiesSvc } from '../../../../services/utilities.svc';
import { ConnectionSvc } from '../../../../services/connection.svc';
import { HttpRequestsService } from '../../../../services/http-requests.service';
import { LsoRequestsService } from '../../../../services/lso-requests.service';
import { LoadingService } from '../../../../services/loading.service';
import { ApplicVarsSvc } from '../../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../../models/workorder-model';
import { WoNoteModel, c_noteTagOptions } from '../../../../models/wo-note-model';

//Data
import { environment } from '../../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-wo-note-edit',
  templateUrl: './wo-note-edit.page.html',
  styleUrls: ['./wo-note-edit.page.scss'],
})
export class WoNoteEditPage implements OnInit {
  //component data
  private PageTitle: string = '';

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private viewCtrl: ModalController,
    private params: NavParams,
    private alertCtrl: AlertController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc) { 
    }


  //presentation data
  private pageFormGroup: FormGroup;
  private tagOptions = c_noteTagOptions.slice(); //
  private masterSymptomCodesData = this.masterTableDataSvc.getMasterSymptomCodes();
  private masterCauseCodesData = this.masterTableDataSvc.getMasterCauseCodes();
  private masterRepairCodesData = this.masterTableDataSvc.getMasterRepairCodes();
  private currWoNum = '';
  private currLineId = 0;
  private currRecType = '';
  private addEditLabel: string = ' Edit ';
  private submitBtnLabel = 'Accept';
  private formHasChanged = true;

  //processing data
  private currWO: WorkorderModel;
  private addEditNL: WoNoteModel = this.workorderDataSvc.createNoteLineObject();
  private initialEntry = true;
  private allowAdd = true;
  private allowEdit = true;
  private isEdit = true;

  prepWo2Save(){
    const fV=this.pageFormGroup.value;

    this.addEditNL.NoteLinkedToRecType = "W";
    this.addEditNL.NoteTags = fV.noteTags;
    this.addEditNL.NotePriority = fV.notePriority;
    this.addEditNL.NoteText = this.pageFormGroup.get('noteText').value; 
    this.addEditNL.NoteLinkedToRecType = "W";
    this.addEditNL.UserId = this.applicVarsSvc.getLoginUserId();
    this.addEditNL.UserName = this.applicVarsSvc.getLoginName();
    this.addEditNL.UserFullName = this.applicVarsSvc.getUserFullName();
    this.addEditNL.CreatedDateTime = this.utilitiesSvc.getCurrDateStr();   
    console.log('data prepped for W/O Update =>',this.addEditNL);

    return this.workorderDataSvc.addUpdateWoNote(this.currWoNum, this.addEditNL, this.isEdit);
  }
  
  
closePage() {
    //console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }

  onSubmit() {
    if (!this.isEdit && this.pageFormGroup.get('noteTags').value !== "") {          
      // check if this is an S/C/A note and if one already exists -- max of 1 allowed per SCA type!!
      if (this.check4Dup(this.pageFormGroup.get('noteTags').value)) return; // leave this process!!!!
    }
    console.log('Submitting ...');
    const fV = this.pageFormGroup.value;
    this.myLoader.present('Saving changes ...');

    const currWoIdx = this.prepWo2Save();
    const WoArray = this.workorderDataSvc.getWoDataObj();
/*1*/ const currWoInstance = WoArray[currWoIdx];
/*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
    const LSOname = this.lsoRequestsSvc.workordersLSOname; 
/** **/
    this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
      .then ((success)=> {
        this.myLoader.dismiss();
        this.formHasChanged = false;
        if (!this.isEdit) { 
          this.isEdit = true; // switching to Edit Mode
          this.closePage(); // if Add, then go to previous page
        }
      }, // (success) {} (after storing in LS)
     (error)=> {alert('Error: could not save WO to local storage');
      this.myLoader.dismiss();}
    ) // end of .then (storing LSO)    
  }

  async presentAlert() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm'+this.addEditLabel+' labor line',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 

            console.log('Submitting ...');
            const fV = this.pageFormGroup.value;
            this.myLoader.present('Saving changes ...');

            const currWoIdx = this.prepWo2Save();
            const WoArray = this.workorderDataSvc.getWoDataObj();
      /*1*/ const currWoInstance = WoArray[currWoIdx];
      /*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
            const LSOname = this.lsoRequestsSvc.workordersLSOname; 
/** **/
            this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {
                this.formHasChanged = false;
                if (!this.isEdit) { 
                  this.isEdit = true; // switching to Edit Mode
                }
               if (!this.isEdit) this.closePage(); // if Add, then go to previous page
              }, // (success) {} (after storing in LS)
             (error)=> {alert('Error: could not save WO to local storage');
              this.myLoader.dismiss();}
            ) // end of .then (storing LSO)
           /** **/
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


  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }

	onClearCompletedDate() {
    this.pageFormGroup.get('dateCompleted').setValue('');
  }


  setCodeFormValidators(selOptVal: string) {
  }

  extractCodeFromText(): string {
    const noteText = this.addEditNL.NoteText;
    if (noteText.length >=3 && noteText[0] == "[") {
      return this.utilitiesSvc.parseOutToken(noteText.substring(1), ']');
    }
    else return '';
  }

  setCodeFormValues(selOptVal: string) {
    if (!this.isEdit) {
      this.addEditNL.NoteLinkedToRecType = selOptVal;
      this.addEditNL.NoteLinkedToRecType = 'W';

    }
  }

  findNextWoNoteMobLineId(arrObj: WoNoteModel[]): number {
    const lastIdx = arrObj.length - 1;
    let largestId = 100;

    if ( lastIdx >= 0 ) {
      for (let i = 0; i <= lastIdx; i++) {
        if (arrObj[i].NoteLinkedToRecType=='W' && arrObj[i].MobLineId > largestId) { largestId = arrObj[i].MobLineId }
        //console.log('**REMOVE: findNextMobLineId (2) ==> ', arrObj[i].MobLineId, largestId);
      }
    }
    console.log('**REMOVE findNextWoNoteMobLineId', largestId+1);
    return largestId+1;
  }

  removeInvalidAddOptions() {
    const arrObj = this.currWO.WoNotes;
    const lastIdx = arrObj.length - 1;

    if ( lastIdx >= 0 ) {
      for (let i = 0; i <= lastIdx; i++) {
        if (arrObj[i].NoteLinkedToRecType=='W' && arrObj[i].NoteTags !== "Report-Other") {
          const tagIdx = this.tagOptions.indexOf(arrObj[i].NoteTags) 
          if (tagIdx > -1) {
            this.tagOptions.splice(tagIdx,1);
            console.log('**REMOVE removeInvalidAddOptions, i=',i, tagIdx, ', options=', this.tagOptions);
           }
        }
      }
      console.log('**REMOVE removeInvalidAddOptions (exit)', this.tagOptions);
    }

  }
  ionViewDidEnter() {
    console.log('DID ENTER Labor Add/Edit PAGE!');
    if (this.initialEntry) {
      this.initialEntry = false;
    }
    if (this.isEdit) {      
      this.pageFormGroup.get('noteTags').setValue(this.addEditNL.NoteTags);
      this.pageFormGroup.get('notePriority').setValue(this.addEditNL.NotePriority);
      this.pageFormGroup.get('noteText').setValue(this.addEditNL.NoteText);
      this.setCodeFormValues(this.addEditNL.NoteTags);
    }
    else { // this is Add Labor
      //const userId = this.applicVarsSvc.getLoginUserId();
      this.addEditNL.MobLineId = this.findNextWoNoteMobLineId(this.currWO.WoNotes);
      this.addEditNL.MobDispSeq = this.addEditNL.MobLineId.toString();
      this.addEditNL.MobDispSeq = this.addEditNL.MobLineId.toString();
    }
    this.allowEdit = this.currWO.WoMobStatusId < 4;

     // give sufficient time to ensure all form fields have been rendered
    setTimeout(()=>this.formHasChanged = false, 250)}
  
  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'noteTags': new FormControl('',[Validators.required]),
      'notePriority': new FormControl(false),
      'noteText': new FormControl('',[Validators.required])
    });

    this.currWoNum = this.params.data.values['wonum'];
    this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    this.currLineId = this.params.data.values['line'];
    this.currRecType = this.params.data.values['type'];
    console.log('params =>', this.params, this.currWoNum, this.currLineId, this.currRecType);

    this.isEdit = (this.currLineId > 0); 
    this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    console.log('currWO =>', this.currWO);
    console.log('*** idxNL =>', this.currLineId);
    if (this.isEdit) {
      this.PageTitle = 'WO '+this.currWoNum+' Note ('+this.currLineId.toString()+')';
      const idxNL = 
        this.workorderDataSvc.getIdxFromMobLineId(this.currLineId, this.currWO.WoNotes);
      console.log('wonum->', this.currWoNum, ', line:', this.currLineId,
      this.currWO.WoNotes[idxNL]);
      this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO.WoNotes[idxNL], this.addEditNL);
      console.log('this NL ->', this.addEditNL);
    } 
    else {
      this.PageTitle = 'WO '+this.currWoNum+' Add Note';
      this.addEditLabel = ' Add ';
      this.removeInvalidAddOptions();
    }
    this.submitBtnLabel = 'Accept' + this.addEditLabel;
      
    this.pageFormGroup.valueChanges
    .subscribe( (value )=> {
      this.formHasChanged = true;
      if (this.isEdit) {this.submitBtnLabel = "Submit Edit"}
      else {this.submitBtnLabel = "Submit Add"}
      //console.log('**REMOVE: formHasChanged!!');
    } );

  
    this.pageFormGroup.get('noteTags').valueChanges.subscribe(val => {
      this.setCodeFormValidators(this.pageFormGroup.get('noteTags').value);
      if (!this.isEdit && val !== "" && val !== "Report-Other") {          
        // check if this is an S/C/A note and if one already exists -- max of 1 allowed per SCA type!!
        if (this.check4Dup(val)) this.pageFormGroup.get('noteTags').setValue('Report-Other');
      }
    });


    this.pageFormGroup.get('notePriority').valueChanges.subscribe(val => {
      this.addEditNL.NotePriority = this.pageFormGroup.get('notePriority').value;
    });

  }

  check4Dup(val: string): boolean {
    const lastIdx = this.currWO.WoNotes.length - 1;
    for (let i = 0; i <= lastIdx; i++) { 
      if (this.currWO.WoNotes[i].NoteTags == val && val !== 'Report-Other') {
        alert('A '+val+' note already exists!');     
        return true;       
      }
    }
    return false; // no dup found
  }
}
/*

  setCodeFormValidators(selOptVal: string) {
    const selOptNum = this.tagOptions.indexOf(selOptVal);
    if (selOptNum <3 ) { // S/C/A type of note has been selected
      this.addEditNL.NoteLinkedToRecType = selOptNum.toString(); // "0" or "1" or "2" --> S/C/A
      switch (selOptNum) {
        case 0: {this.pageFormGroup.get('symptomCode').setValidators; break;}
        case 1: {this.pageFormGroup.get('causeCode').setValidators; break;}
        case 2: {this.pageFormGroup.get('repairCode').setValidators; break;}
      }
      this.addEditNL.NoteLinkedToRecType = selOptNum.toString();
    }
    else {
      this.addEditNL.NoteLinkedToRecType = 'W';
      this.pageFormGroup.get('symptomCode').clearValidators;
      this.pageFormGroup.get('causeCode').clearValidators;
      this.pageFormGroup.get('repairCode').clearValidators;
    }
  }

    this.pageFormGroup.get('symptomCode').valueChanges.subscribe(val => {
      const selOptVal = this.pageFormGroup.get('symptomCode').value;
      //console.log('**REMOVE - looking up Symptom desc from Code ==>', selOptVal);
      this.addEditNL.NoteText = '['+selOptVal+'] '+this.masterTableDataSvc.getSymptomCodeText(selOptVal);
      this.pageFormGroup.get('noteText').setValue(this.addEditNL.NoteText); 
    });

    this.pageFormGroup.get('causeCode').valueChanges.subscribe(val => {
      const selOptVal = this.pageFormGroup.get('causeCode').value;
      this.addEditNL.NoteText = '['+selOptVal+'] '+this.masterTableDataSvc.getCauseCodeText(selOptVal);
      this.pageFormGroup.get('noteText').setValue(this.addEditNL.NoteText); 
    });

    this.pageFormGroup.get('repairCode').valueChanges.subscribe(val => {
      const selOptVal = this.pageFormGroup.get('repairCode').value;
      this.addEditNL.NoteText = '['+selOptVal+'] '+this.masterTableDataSvc.getRepairCodeText(selOptVal);
      this.pageFormGroup.get('noteText').setValue(this.addEditNL.NoteText); 
    });


        <!-- Input item #3 -->  
        <ion-item *ngIf="addEditNL.NoteLinkedToRecType == '0'">
            <ion-label floating>Symptom Code</ion-label>
            <ion-select formControlName="symptomCode">
                <ion-select-option
                *ngFor="let item of masterSymptomCodesData"
                [value]="item.SymptomCode"> {{ item.SymptomCode }}-{{ item.SymptomDesc }}</ion-select-option>
            </ion-select>
        </ion-item>

        <!-- Input item #3 -->  
        <ion-item *ngIf="addEditNL.NoteLinkedToRecType == '1'">
            <ion-label floating>Cause Code</ion-label>
            <ion-select formControlName="causeCode">
                <ion-select-option
                *ngFor="let item of masterCauseCodesData"
                [value]="item.CauseCode"> {{ item.CauseCode }}-{{ item.CauseDesc }}</ion-select-option>
            </ion-select>
        </ion-item>

        <!-- Input item #3 -->  
        <ion-item *ngIf="addEditNL.NoteLinkedToRecType == '2'">
            <ion-label floating>Action/Repair Code</ion-label>
            <ion-select formControlName="repairCode">
                <ion-select-option
                *ngFor="let item of masterRepairCodesData"
                [value]="item.RepairCode"> {{ item.RepairCode }}-{{ item.RepairDesc }}</ion-select-option>
            </ion-select>
        </ion-item>

        <!-- Input item #4 -->   
        <ion-item>
            <ion-label position="floating"><b>Note text:</b></ion-label>
            <ion-textarea class="desc-style" type="text"
            placeholder="Enter your information here"
            formControlName="noteText" rows="6">
            </ion-textarea>

        </ion-item>
        */
