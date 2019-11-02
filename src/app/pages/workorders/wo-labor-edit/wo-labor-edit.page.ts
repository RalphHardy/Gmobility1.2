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
import { WoLaborLineModel, WoLaborAddEditModel } from '../../../models/wo-labor-line-model';
import { WoActualTimeModel } from '../../../models/wo-actual-time-model';
import { EmployeeSearchModel } from '../../../models/master-employee-model';

//Pages
import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';

const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-wo-labor-edit',
  templateUrl: './wo-labor-edit.page.html',
  styleUrls: ['./wo-labor-edit.page.scss']
})
export class WoLaborEditPage implements OnInit {
  //component data
  private PageTitle: string = 'Labor Edit';

  //private minInputDateStr = this.utilitiesSvc.addDays2CurrDateRtnStr(-21); //** component min-date not working properly*/
  private currDateStr = this.utilitiesSvc.getCurrDateStr();

  
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
  private tradeCodes: Array<string> = this.masterTableDataSvc.getTradeCodes();
  private addEditLabel: string = ' Edit ';
  private submitBtnLabel = 'Accept';
  private formHasChanged = false;
  private changeAllowed: boolean = true;
  private woStatus = 99;
  private numTimeCards: number = 0;

  private currWoNum = '';
  private currDate = this.utilitiesSvc.getCurrDateStr();

  //processing data
  private currWO: WorkorderModel;
  private addEditLL: WoLaborAddEditModel = this.workorderDataSvc.createAddEditLaborLineObject();
  private addTC: WoActualTimeModel = this.workorderDataSvc.createTimeCardObject();
  private initialEntry = true;
  private allowEdit = true;
  private isEdit = true;
  private idxLL = 0;



	onClearHrsWorked() {
    this.pageFormGroup.get('hoursWorked').setValue('');
  }
  
  async onSelectEmployee() {
    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: SelEmployeePage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then (<EmployeeSearchModel>(rtnValue) => {
        console.log('Returned from SelEmployeePage:', rtnValue);
        if (rtnValue.data !== "") {
          this.pageFormGroup.get('empNum').setValue(rtnValue.data.EmpNum);            
          this.addEditLL.EmpName = rtnValue.data.EmpName; 
        }
      });
    return await modalPage.present();
  } 

  onClickTimecards(lineId:number) {
    //  href="tabs/sel-workorder/workorder/{{WO.WoNumber}})" 
    this.navCtrl.navigateForward('tabs/sel-workorder/timecards/'+this.currWoNum+'/'+lineId.toString()); //labor.lineId
  }

  /*
  onAddEditTimeCard(tcLineId: number) {
    this.navCtrl.navigateForward('tabs/sel-workorder/timecard-edit/'+this.currWoNum+'/'+ this.addEditLL.MobLineId.toString()+'/'+tcLineId.toString());
  }
  */
  prepWo2Save(): number{
    const fV=this.pageFormGroup.value;
    this.addEditLL.Description = fV.laborDesc;
    this.addEditLL.EmpNum = fV.empNum;
    this.addEditLL.EmpName = this.masterTableDataSvc.getEmpName(fV.empNum);
    this.addEditLL.TradeDesc = fV.tradeDesc;
    this.addEditLL.TradeId = this.masterTableDataSvc.getTradeId(fV.tradeDesc);
    this.addEditLL.StartDateTime = fV.dateStarted;
    this.addEditLL.CompletedDateTime = fV.dateCompleted;   

    const woIdx = this.workorderDataSvc.addUpdateWoLabor(this.addEditLL, this.isEdit, fV.createTC);
    const llIdx = this.currWO.WoLaborLines.length - 1;

    if (!this.isEdit && fV.createTC && fV.hoursWorked > 0) {//add new/first timecard for the new labor line
      this.addTC.EmpNum = this.addEditLL.EmpNum;
      this.addTC.EmpName =  this.addEditLL.EmpName;
      this.addTC.Hours = fV.hoursWorked;
      this.addTC.WorkDate = this.addEditLL.StartDateTime;
      this.addTC.MobLineId = 1; // this.workorderDataSvc.findNextMobLineId(this.currWO.WoLaborLines[llIdx].WoActualTimeLines);
      console.log('Auto-adding Timecard...', this.addTC);
      this.workorderDataSvc.addUpdateWoTimecard(this.addEditLL.WoNumber, llIdx, this.addTC, this.isEdit);
      this.addEditLL.CompletedDateTime = this.currWO.WoLaborLines[llIdx].CompletedDateTime;
      this.pageFormGroup.get('dateCompleted').setValue(this.addEditLL.CompletedDateTime);
    }
    
    console.log('data prepped for W/O Update =>',this.addEditLL);
    return woIdx;
  }   

  onSubmit() { 
    const fV = this.pageFormGroup.value;
    if (!this.isEdit && fV.createTC && fV.hoursWorked <= 0) {
    alert('To add time card you must enter hours');
    return;
    }

    if (fV.dateStarted !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.dateStarted)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.dateStarted)+') is invalid.\nPlease try again.');
      return; 
    }
    if (fV.dateCompleted !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.dateCompleted)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.dateCompleted)+') is invalid.\nPlease try again.');
      return;
    }

    this.myLoader.present('Saving changes ...');

    const currWoIdx = this.prepWo2Save();
    const WoArray = this.workorderDataSvc.getWoDataObj();
  /*1*/ const currWoInstance = WoArray[currWoIdx];
  /*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
    const LSOname = this.lsoRequestsSvc.workordersLSOname; 
    this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
      .then ((success)=> {                
        this.setIsEditBasedData();
        this.myLoader.dismiss();
      }, // (success) {} (after storing in LS)
    (error)=> {alert('Error: could not save WO to local storage');
      this.myLoader.dismiss();}
    ); // end of .then (storing LSO)
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
            if (!this.isEdit && this.pageFormGroup.get('createTC').value && this.pageFormGroup.get('hoursWorked').value <= 0) {
              alert('To add time card you must enter hours');
              return;
            }

            console.log('Submitting ...');
            const fV = this.pageFormGroup.value;
            this.myLoader.present('Saving changes ...');

            const currWoIdx = this.prepWo2Save();
            const WoArray = this.workorderDataSvc.getWoDataObj();
      /*1*/ const currWoInstance = WoArray[currWoIdx];
      /*1*/ currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
            const LSOname = this.lsoRequestsSvc.workordersLSOname; 
            this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {                
                this.setIsEditBasedData();
                this.myLoader.dismiss();
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

  closePage() {
    this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
    //console.log('onCancel', this.connectionSvc.getParentRoot());
  }
 
  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }

	onClearCompletedDate() {
    this.pageFormGroup.get('dateCompleted').setValue('');
  }
  setCompletedDate() {
    this.pageFormGroup.get('dateCompleted').setValue(this.utilitiesSvc.getCurrDateStr());
  }
  
  setIsEditBasedData(){
    this.PageTitle = 'WO '+this.currWoNum+' Labor ('+this.addEditLL.MobLineId.toString()+')';
    this.addEditLabel = ' Edit ';
    if (!this.isEdit) this.isEdit = true;
    this.submitBtnLabel = 'Accept Edit';

    setTimeout(()=>this.formHasChanged = false, 300);
    //* Labor Line Specific...
    this.pageFormGroup.get('createTC').setValue(false);
    this.idxLL = this.workorderDataSvc.getIdxFromMobLineId(this.addEditLL.MobLineId, this.currWO.WoLaborLines);
    //console.log('*** this.idxLL =>', this.idxLL);
  }

  ionViewDidEnter() {
    console.log('DID ENTER Labor Add/Edit PAGE!');
    if (this.initialEntry) { // only perform this for original entry (following ngInit)
      this.initialEntry = false;
      if (this.isEdit) {     
        this.idxLL = this.workorderDataSvc.getIdxFromMobLineId(this.addEditLL.MobLineId, this.currWO.WoLaborLines);
        this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO.WoLaborLines[this.idxLL], this.addEditLL);

        this.pageFormGroup.get('laborDesc').setValue(this.addEditLL.Description);
        this.pageFormGroup.get('empNum').setValue(this.addEditLL.EmpNum);
        this.pageFormGroup.get('tradeDesc').setValue(this.addEditLL.TradeDesc);
        this.pageFormGroup.get('dateStarted').setValue(this.addEditLL.StartDateTime); 
        this.pageFormGroup.get('dateCompleted').setValue(this.addEditLL.CompletedDateTime);
        this.numTimeCards =  this.currWO.WoLaborLines[this.idxLL].WoActualTimeLines.length;
        this.setIsEditBasedData();
      }
      else { // this is Add Labor
        this.submitBtnLabel = "Accept Add";
        this.pageFormGroup.get('createTC').setValue(this.allowEdit && !this.isEdit);
        const userId = this.applicVarsSvc.getLoginUserId();
        const empNum = this.applicVarsSvc.getUserEmpNum();
        this.addEditLL.EmpName = this.masterTableDataSvc.getEmpName(empNum);
        this.pageFormGroup.get('empNum').setValue(empNum);
        this.pageFormGroup.get('dateStarted').setValue(this.currDate);
        this.addEditLL.MobLineId = this.workorderDataSvc.findNextMobLineId(this.currWO.WoLaborLines);
        this.addEditLL.MobDispSeq = this.addEditLL.MobLineId.toString(); 
        //find employee trade
        this.addEditLL.TradeId = this.masterTableDataSvc.getEmpTrade(empNum);
        this.addEditLL.TradeDesc = this.masterTableDataSvc.getTradeDesc(this.addEditLL.TradeId);
        this.pageFormGroup.get('tradeDesc').setValue(this.addEditLL.TradeDesc);
        setTimeout(()=>this.formHasChanged = false, 300);
      }
    }
  }
   
  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'laborDesc': new FormControl(''),
      'empNum': new FormControl("",[Validators.required]),
      'tradeDesc': new FormControl('', [Validators.required]),
      'dateStarted': new FormControl('',[Validators.required]),
      'hoursWorked': new FormControl(0,[]),
      'dateCompleted': new FormControl(''),
      'createTC': new FormControl(true)
    });
    //console.log('**REMOVE: currDateStr=>', this.currDateStr);
    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.addEditLL.MobLineId= params['line'];
          this.isEdit = (this.addEditLL.MobLineId > 0); 
          this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          this.woStatus = this.currWO.WoMobStatusId;
          this.changeAllowed = this.workorderDataSvc.ok2EditWo(this.woStatus);
          console.log('currWO =>', this.currWO);
          if (this.isEdit) {
            //this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO.WoLaborLines[this.idxLL], this.addEditLL);
            //console.log('this LL ->', this.addEditLL);
          } 
          else {
            this.addEditLL.WoNumber = this.currWoNum;
            this.PageTitle = 'WO '+this.currWoNum+' Add Labor';
            this.addEditLabel = ' Add ';
          }
        },
        (err) => {

        }
      )
      
      this.pageFormGroup.valueChanges
      .subscribe( (value )=> {
        if (this.workorderDataSvc.ok2EditWo(this.woStatus)) this.formHasChanged = true;
        //console.log('**REMOVE - OK2Edit=',this.workorderDataSvc.ok2EditWo(this.woStatus), 'formHasChanged =', this.formHasChanged);
      } );
      
      this.pageFormGroup.get('empNum').valueChanges
      .subscribe( (value )=> {
        this.addEditLL.EmpName = this.masterTableDataSvc.getEmpName(value);
      } );
      this.pageFormGroup.get('createTC').valueChanges
      .subscribe( (value )=> {
        //console.log('>> createTC',this.pageFormGroup.get('createTC').value);
      } );
      this.pageFormGroup.get('dateStarted').valueChanges
      .subscribe( (value )=> {
        if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
          alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
        }
      } );
      this.pageFormGroup.get('dateCompleted').valueChanges
      .subscribe( (value )=> {
        if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
          alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
        }
      } );

      this.pageFormGroup.get('hoursWorked').valueChanges
      .subscribe( (value )=> {
        //console.log('exec change', value);
        this.pageFormGroup.get('createTC').setValue( (value) && Number(value)>0 ); 
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
      <ion-label fixed><b>Date Started:</b> </ion-label>
      <ion-datetime  formControlName="dateStarted"
        display-format="DD-MMM-YYYY" 
        max="{{currDateStr}}" >>
      </ion-datetime>

      <ion-datetime  
        formControlName="dateCompleted"
        display-format="DD-MMM-YYYY" 
        max="{{currDateStr}}" >
      </ion-datetime>

*/