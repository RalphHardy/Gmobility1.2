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
import { WorkorderModel, WorkorderEditModel, WoDatesModel } from '../../../models/workorder-model';

import { MasterTradesModel } from '../../../models/master-trades-model';
import { MasterEquipmentModel } from "../../../models/master-equipment-model";
import { MasterWoTypesModel } from "../../../models/master-wo-types-model";
import { MasterEmployeeModel } from '../../../models/master-employee-model';

//Pages
import { SelEquipmentPage } from '../../selectforms/sel-equipment/sel-equipment.page';
import { WoLaborEditPage } from '../wo-labor-edit/wo-labor-edit.page';
import { WoDatesPage } from '../wo-dates/wo-dates.page';
import { TimecardsPage } from '../timecards/timecards.page';
import { TimecardEditPage } from '../timecard-edit/timecard-edit.page';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
import { Alert } from 'selenium-webdriver';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;


@Component({
  selector: 'app-workorder-edit',
  templateUrl: './workorder-edit.page.html',
  styleUrls: ['./workorder-edit.page.scss'],
})
export class WorkorderEditPage implements OnInit {
  //component data
  private PageTitle: string = '';

  //presentation data
  private currWoNum = ''; 
  private changeStatusOpts: Array<string> = [];
  private woStatusCodes: Array<string> = this.workorderDataSvc.woStatusCodes;
  private woTypeCodes:Array<string>  = this.masterTableDataSvc.getWoTypeCodes(true);
 

  //processing data
  private currWO: WorkorderModel;
  private initialEntry = true;
  private allowAdd = true; 
  private allowEdit = true;
  private isEdit = true;

  constructor(
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private navCtrl: NavController,   
    private actionSheetController: ActionSheetController, 
    private router: Router,
    private route: ActivatedRoute,
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

  //processing data
  private submitBtnLabel = 'Accept';
  private editWO: WorkorderEditModel;
  private woDates: WoDatesModel;

  //private woTypeCodes:Array<string>;
  private tradeCodes: Array<string> = this.masterTableDataSvc.getTradeCodes();
  private machineStateCodes: Array<string> = this.masterTableDataSvc.getMachineStateCodes();
  private priorityCodes = this.workorderDataSvc.priorityCodes;
  private masterSymptomCodesData = this.masterTableDataSvc.getMasterSymptomCodes();
  private masterCauseCodesData = this.masterTableDataSvc.getMasterCauseCodes();
  private masterRepairCodesData = this.masterTableDataSvc.getMasterRepairCodes();

	private otherButtonClicked = false;
  private clickedSelEmployee = false;
  private formHasChanged = false;
  private changeAllowed: boolean = true;
  private woStatus = 99;

  goToNotes(noteType: string) {

    this.navCtrl.navigateForward('tabs/sel-workorder/notes/'+ this.currWoNum);
  }

  async editWoDates() {    
    return; // **TEMPORARY
    const modalPage = await this.modalCtrl.create({
      component: WoDatesPage,
      componentProps: { woDates: this.woDates }
    });

    modalPage.onDidDismiss()
      .then((rtnEditWo: any) => {
        console.log('**REMOVE - Returned from Wo-Dates', rtnEditWo);
        //alert('needSiteAccess='+JSON.stringify(this.needSiteAccess.valueOf)+'\nready2Login='+JSON.stringify(this.ready2Login) );
      });
    return await modalPage.present();
  }

  async onSelectEquipment() {

    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: SelEquipmentPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from SelEquipmentPage:', rtnValue.data.EquipNum,
        rtnValue.data.Description, rtnValue.data);
        if (rtnValue) {
          this.pageFormGroup.get('equipNum').setValue(rtnValue.data.EquipNum);            
          this.editWO.EquipNumber = rtnValue.data.EquipNum; 
          this.editWO.EquipDesc = rtnValue.data.Description;
        }
      });
    return await modalPage.present();
  } 

  prepWo2Save(): number{
    const fV=this.pageFormGroup.value;
    this.editWO.EquipNumber = fV.equipNum;
    //* EquipDesc set by change subscription
    this.editWO.UrgentFlag = fV.urgentFlag;
    this.editWO.TradeDesc = fV.tradeDesc;
    this.editWO.TradeId = this.masterTableDataSvc.getTradeId(fV.tradeDesc);

    this.editWO.MachineStateId = this.masterTableDataSvc.getMachStateId(fV.machStateDesc);
    this.editWO.MachineStateDesc = fV.machStateDesc;

    this.editWO.PriorityId = Number(fV.priorityCode);

    this.editWO.CauseCode = fV.causeCode;
    this.editWO.CauseDesc = this.masterTableDataSvc.getCauseCodeText(fV.causeCode);
    this.editWO.RepairCode = fV.repairCode; 
    this.editWO.RepairDesc = this.masterTableDataSvc.getRepairCodeText(fV.repairCode);
    this.editWO.SymptomCode = fV.symptomCode;
    this.editWO.SymptomDesc = this.masterTableDataSvc.getSymptomCodeText(fV.symptomCode);
    
    // note: newStatus is handled by formControl change event

    console.log('data prepped for W/O Update =>',this.editWO);

/*1*/return this.workorderDataSvc.updateWoHeader(this.editWO); // woIdx
  }
   
  async presentAlert() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm accept change to work order',
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
            this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {

                this.formHasChanged = false;
                this.myLoader.dismiss();
              }, // (success) {} (after storing in LS)
             (error)=> {alert('Error: could not save WO to local storage');
              this.myLoader.dismiss();}
            ) // end of .then (storing LSO)
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

  onSubmit() {
    this.presentAlert();
  }
 

  closePage() {
    this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
    //console.log('onCancel', this.connectionSvc.getParentRoot());
  }

  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }

  getUrgentColor(): string {
    if (this.pageFormGroup.get('urgentFlag').value) return 'danger'
    else return 'button-action'
  }
	
  ionViewDidEnter() {
    if (this.initialEntry) {
      this.initialEntry = false;      
    }
    else
    {
      //this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    }
    this.pageFormGroup.get('equipNum').setValue(this.editWO.EquipNumber);
    this.pageFormGroup.get('urgentFlag').setValue(this.editWO.UrgentFlag);
    this.pageFormGroup.get('currStatusDesc').setValue(this.editWO.WoMobStatusDesc);
    this.pageFormGroup.get('priorityCode').setValue(this.editWO.PriorityId);
    this.pageFormGroup.get('machStateDesc').setValue(this.editWO.MachineStateDesc); 
    this.pageFormGroup.get('tradeDesc').setValue(this.editWO.TradeDesc);
    this.pageFormGroup.get('woTypeDesc').setValue(this.currWO.WoTypeDesc);
    this.pageFormGroup.get('causeCode').setValue(this.editWO.CauseCode);
    this.pageFormGroup.get('repairCode').setValue(this.editWO.RepairCode);
    this.pageFormGroup.get('symptomCode').setValue(this.editWO.SymptomCode);

    this.changeStatusOpts = this.workorderDataSvc.getWoStatusChgOpts(this.currWoNum);

    //this.pageFormGroup.get('machState').setValue(this.editWO.MachineStateDesc);
    const currStatus = this.woStatusCodes[this.editWO.WoMobStatusId];
    this.editWO.WoMobStatusDesc = this.woStatusCodes[this.editWO.WoMobStatusId]; 

    setTimeout(()=>this.formHasChanged = false, 250);
  }
 
  ngOnInit() {
    this.PageTitle = 'Error: WO-Edit';

    this.pageFormGroup = new FormGroup({     
      'urgentFlag': new FormControl(false),
      'equipNum': new FormControl(''),
      'currStatusDesc': new FormControl(''),
      'priorityCode': new FormControl(3,[Validators.required]),
      'woTypeDesc': new FormControl('',[Validators.required]),
      'machStateDesc': new FormControl(''),
      'tradeDesc': new FormControl('',[Validators.required]),
      'symptomCode': new FormControl(''),
      'causeCode': new FormControl(''),
      'repairCode': new FormControl('')
      //'chgStatusDesc': new FormControl('')
    });
    

    this.editWO = this.workorderDataSvc.createEditWorkorderObject();

    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.PageTitle = 'WO Edit '+this.currWoNum;
          this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          this.woStatus = this.currWO.WoMobStatusId;
          this.changeAllowed = this.workorderDataSvc.ok2EditWo(this.woStatus);
          // Now create an "Add" workorder object and then copy the prop values from the stored one...
          this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO, this.editWO);
          console.log('wonum->', this.currWoNum, this.editWO);
        },
        () => {
        }
      )
    
    //** Add Code for Form Value Changes ... **//
    this.pageFormGroup.valueChanges
    .subscribe( (value)=> {
      if (this.workorderDataSvc.ok2EditWo(this.woStatus)) this.formHasChanged = true;
      //console.log('**REMOVE - OK2Edit=',this.workorderDataSvc.ok2EditWo(this.woStatus), 'formHasChanged =', this.formHasChanged);
    });

    this.pageFormGroup.get('equipNum').valueChanges
    .subscribe( (value )=> {
      this.editWO.EquipDesc = this.masterTableDataSvc.getEquipDesc(value);
    } );

    this.pageFormGroup.get('urgentFlag').valueChanges
    .subscribe( (value )=> {
      this.editWO.UrgentFlag = value;
    } );

  }
  async selectMenuItem() {
    const actionSheet = await this.actionSheetController.create({
        buttons: [{
                text: 'Notes ('+this.currWO.WoNotes.length+')',
                handler: () => {
                  this.navCtrl.navigateForward('tabs/sel-workorder/notes/'+ this.currWoNum);
                }
            },
            {
                text: 'Attachments ('+this.currWO.WoAttachFiles.length+')',
                handler: () => {
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

    <!-- S/C/A NOTES -->
    <ion-button expand="full" color="warning"
    (click)="goToNotes()">
    Press for S/C/A &amp; other Notes ({{this.currWO.WoNotes.length}})
    </ion-button>


  <ion-item>
      <ion-label position="fixed" ><b>New Status</b></ion-label>
    <ion-select formControlName="chgStatusDesc">
      <ion-select-option
        *ngFor="let newStatus of changeStatusOpts"
        [value]="chgStatus">
        {{newStatus}}
      </ion-select-option>
    </ion-select>
  </ion-item>


  <ion-button expand="full" color="warning"
  (click)="changeWoStatus(currWoNum)">
  Press to Change Status
  </ion-button>
  
 this.pageFormGroup.get('chgStatusDesc').valueChanges
      .subscribe( (value )=> {
        const chgVal = value;
        console.log('chgStatusDesc changed', '['+value+']');
        if ( (chgVal == "In-process") &&
              (this.pageFormGroup.get('chgStatusDesc').value == 'Incomplete') ) this.allowEdit = true;
        if ( (this.pageFormGroup.get('chgStatusDesc').value == "Assigned to pool") &&
            (chgVal != '') && // avoid infinite loop
            (!this.httpRequestsSvc.connected2Server) ) {
          this.pageFormGroup.get('chgStatusDesc').setValue('');
          alert('Cannot draw work order from pool unless connected to server.');
        }
      } );

*/