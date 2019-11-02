import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { HttpRequestsService } from '../../../services/http-requests.service';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { LoadingService } from '../../../services/loading.service';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';
import { WoLaborLineModel } from '../../../models/wo-labor-line-model';
import { WoActualTimeModel } from '../../../models/wo-actual-time-model';

//Pages
import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
import { DELEGATE_CTOR } from '@angular/core/src/reflection/reflection_capabilities';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-timecard-edit',
  templateUrl: './timecard-edit.page.html',
  styleUrls: ['./timecard-edit.page.scss'],
})
export class TimecardEditPage implements OnInit {
  //component data
  private PageTitle: string = 'Timecard';

  //presentation data
  private currWoNum = '';
  private laborLineId = 0;
  private tcLineId = 0;

  //processing data
  private currWO: WorkorderModel;
  private currLL: WoLaborLineModel;
  private addEditTC: WoActualTimeModel = this.workorderDataSvc.createTimeCardObject();
  private initialEntry = true;
  private allowAdd = true;
  private allowEdit = true;
  private isEdit = true;

  constructor(
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController, 
    private alertCtrl: AlertController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc) { }

  //presentation data
  private pageFormGroup: FormGroup;
  private addEditLabel: string = ' Edit ';
  private submitBtnLabel = 'Accept';
  private formHasChanged = false;


  //processing data
  private idxLL: number = 0;
  private minInputDateStr = this.utilitiesSvc.addDays2CurrDateRtnStr(-11);
  private currDateStr = this.utilitiesSvc.getCurrDateStr();

  async onSelectEmployee() {

    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: SelEmployeePage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        if (rtnValue) {
          console.log('Returned from SelEmployeePage:', rtnValue.data);
          this.pageFormGroup.get('empNum').setValue(rtnValue.data.EmpNum);            
          this.addEditTC.EmpName = rtnValue.data.EmpName; 
        }
      });
    return await modalPage.present();
  } 
  
  closePage() {
    this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
    //console.log('onCancel', this.connectionSvc.getParentRoot());
  } 

  deleteTimecard(): number {
    return this.workorderDataSvc.deleteTimecard(this.currWoNum, this.idxLL, this.addEditTC);
  }

  prepWo2Save(): number{
    const fV=this.pageFormGroup.value;
    this.addEditTC.EmpNum = fV.empNum;
    this.addEditTC.EmpName = this.masterTableDataSvc.getEmpName(fV.empNum);
    this.addEditTC.Hours = fV.hoursWorked;
    this.addEditTC.WorkDate = this.utilitiesSvc.fixDateFromPicker(fV.workDate);
    if (!this.isEdit) {
      this.addEditTC.MobLineId = this.workorderDataSvc.findNextMobLineId(this.currWO.WoLaborLines[this.idxLL].WoActualTimeLines);
      this.addEditTC.MobDispSeq = this.addEditTC.MobLineId.toString(); 
    }  
    //console.log('data prepped for W/O Update =>',this.addEditTC.WorkDate, this.addEditTC);

    return this.workorderDataSvc.addUpdateWoTimecard(this.currWoNum, this.idxLL, this.addEditTC, this.isEdit);
  }
  
  onSubmit() {
    const fV = this.pageFormGroup.value;
    if (fV.workDate !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.workDate)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.workDate)+') is invalid.\nPlease try again.');
      return;
    }

    var msgStr = 'Confirm'+this.addEditLabel+' Time Card';
    const deleteTC = (this.isEdit && this.pageFormGroup.get('hoursWorked').value <= 0);
    if (deleteTC) msgStr = 'Confirm deletion of Time Card';

    this.myLoader.present('Saving changes ...',500);

    var currWoIdx = -1;
    if (deleteTC) currWoIdx = this.deleteTimecard();
    else currWoIdx = this.prepWo2Save();
    const WoArray = this.workorderDataSvc.getWoDataObj();
/*1*/ const currWoInstance = WoArray[currWoIdx];
/*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
    const LSOname = this.lsoRequestsSvc.workordersLSOname; 
    this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
      .then ((success)=> {
        this.formHasChanged = false;
        this.myLoader.dismiss();
        this.closePage();
      }, // (success) {} (after storing in LS)
     (error)=> {alert('Error: could not save WO to local storage');
      this.myLoader.dismiss();}
    ); // end of .then (storing LSO)
  }

  async presentAlert() {
    //** NO LONGER USED  **/
    var msgStr = 'Confirm'+this.addEditLabel+' Time Card';
    const deleteTC = (this.isEdit && this.pageFormGroup.get('hoursWorked').value <= 0);
    if (deleteTC) msgStr = 'Confirm deletion of Time Card';

    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: msgStr,
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 

            console.log('Submitting ...');
            const fV = this.pageFormGroup.value;
            this.myLoader.present('Saving changes ...',500);

            var currWoIdx = -1;
            if (deleteTC) currWoIdx = this.deleteTimecard();
            else currWoIdx = this.prepWo2Save();
            const WoArray = this.workorderDataSvc.getWoDataObj();
      /*1*/ const currWoInstance = WoArray[currWoIdx];
      /*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
            const LSOname = this.lsoRequestsSvc.workordersLSOname; 
            this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {

                this.formHasChanged = false;
                this.myLoader.dismiss();
                this.closePage();
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
	onClearDate() {
    this.pageFormGroup.get('workDate').setValue('');
  }
	onClearHrsWorked() {
    this.pageFormGroup.get('hoursWorked').setValue('');
  }
  
  ionViewDidEnter() {
    console.log('DID ENTER Time Card Add/Edit PAGE!');
    if (this.initialEntry) {
      this.initialEntry = false;
    }
    console.log('ionViewDidEnter (1) isEdit =>', this.isEdit);
    if (this.isEdit) {      
      this.pageFormGroup.get('empNum').setValue(this.addEditTC.EmpNum);
      this.pageFormGroup.get('hoursWorked').setValue(this.addEditTC.Hours); 
      this.pageFormGroup.get('workDate').setValue(this.addEditTC.WorkDate);
    }
    else { // this is Add TimeCard
      const userId = this.applicVarsSvc.getLoginUserId();
      const empNum = this.applicVarsSvc.getUserEmpNum();
      this.addEditTC.EmpName = this.masterTableDataSvc.getEmpName(empNum);
      this.pageFormGroup.get('empNum').setValue(empNum);
    }
    this.allowEdit = this.currWO.WoMobStatusId < 4;
  }

  getIdxLL(lineId: number): number {
    const lastIdx = this.currWO.WoLaborLines.length -1;
    //console.log('lastIdx', lastIdx);
    for (var i = 0; i <= lastIdx; i++) {
      //console.log('compare: ',i, lineId, this.currWO.WoLaborLines[i].MobLineId );
      if (this.currWO.WoLaborLines[i].MobLineId == lineId) {
        //console.log('MATCHED: ',i, lineId, this.currWO.WoLaborLines[i].MobLineId );
        return i;
      }
    }
    return -1;
  }
  
  getIdxTC(lineId: number): number {
    const lastIdx = this.currLL.WoActualTimeLines.length -1;
    //console.log('getIdxTC: lineId =', lineId, ', lastIdx', lastIdx);
    for (var i = 0; i <= lastIdx; i++) {
      //console.log('compare: ',i, lineId, this.currLL.WoActualTimeLines[i].MobLineId );
      if (this.currLL.WoActualTimeLines[i].MobLineId == lineId) {
        //console.log('MATCHED: ',i, lineId, this.currLL.WoActualTimeLines[i] );
        return i;
      }
    }
    return -1;
  }
 
  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'empNum': new FormControl("",[Validators.required]),
      'workDate': new FormControl(this.currDateStr,[Validators.required]),
      'hoursWorked': new FormControl('', [Validators.required])
    });

    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.laborLineId= params['line'];
          this.tcLineId = params['tcline'];
          this.isEdit = (this.tcLineId > 0); 
          this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          console.log('currWO =>', this.currWO, 'this is Edit: ', this.isEdit);
          this.idxLL = this.getIdxLL(this.laborLineId);
          this.currLL = this.currWO.WoLaborLines[this.idxLL];
          console.log('*** idxLL =>', this.idxLL);
          if (this.isEdit) {
            const idxTC = this.getIdxTC(this.tcLineId);  
            console.log('idxTC ==>',idxTC);          
            this.utilitiesSvc.copyPropertiesObj2Obj(this.currLL.WoActualTimeLines[idxTC], this.addEditTC);
            this.PageTitle = 'WO '+this.currWoNum+' Time Card ('+this.tcLineId.toString()+')';
            console.log('wonum->', this.currWoNum, ', T/C line:', this.tcLineId,
              this.addEditTC);
          } 
          else { //add new TimeCard
            this.PageTitle = 'WO '+this.currWoNum+' Add Time Card';
            this.addEditLabel = ' Add ';
          }
          this.submitBtnLabel = 'Accept' + this.addEditLabel;
        },
        (err) => {

        }
      )
      
      this.pageFormGroup.valueChanges
      .subscribe( (value )=> {
        this.formHasChanged = true;
      } );

      this.pageFormGroup.get('empNum').valueChanges
      .subscribe( (value )=> {
        this.addEditTC.EmpName = this.masterTableDataSvc.getEmpName(value);
      } );

      this.pageFormGroup.get('workDate').valueChanges
      .subscribe( (value )=> {
        if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
          alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
        }
      } );

      //
      this.pageFormGroup.get('hoursWorked').valueChanges
      .subscribe( (value )=> {
        //console.log('exec change', value);
        const rndOpt = this.applicVarsSvc.getTimeCardRounding();
        const isRounding = rndOpt>0;
        if (isRounding)
          if (value) {
            const rndUp = this.applicVarsSvc.getTimeCardRoundUp();
            var rtnHrs = -1;
            if (rndOpt==1)
              rtnHrs = this.utilitiesSvc.inputRoundHrsDec25(this.pageFormGroup.get('hoursWorked').value, rndUp);
            else if (rndOpt==2)
              rtnHrs = this.utilitiesSvc.inputRoundHrsDec01(this.pageFormGroup.get('hoursWorked').value, rndUp);
            if (rtnHrs > -1)
              this.pageFormGroup.get('hoursWorked').setValue(rtnHrs);
          }
      } );
  }

  async selectMenuItem() {
    const actionSheet = await this.actionSheetController.create({
        buttons: [{
                text: 'Notes ('+this.currWO.WoNotes.length+')',
                handler: () => {
                  this.workorderDataSvc.setCurrWo(this.currWoNum);
                  this.navCtrl.navigateForward('tabs/sel-workorder/notes/'+ this.currWoNum);
                }
            },
            {
                text: 'Attachments ('+this.currWO.WoAttachFiles.length+')',
                handler: () => {
                  this.workorderDataSvc.setCurrWo(this.currWoNum);
                  this.navCtrl.navigateForward('tabs/sel-workorder/attachments/'+ this.currWoNum);
                }
            },
            {
                text: 'Cancel',
                role: 'cancel'
            }
        ]
    });
    await actionSheet.present();
  }
}
/*
 <!-- Input item #5 -->   
      <ion-item>
          <ion-label stacked><b>Date Worked:</b></ion-label>
          <ion-datetime  formControlName="workDate"
            display-format="DD-MMM-YYYY"
            max="{{currDateStr}}" >
          </ion-datetime>
        </ion-item>
*/
