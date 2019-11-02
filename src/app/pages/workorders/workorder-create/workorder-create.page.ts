import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IonicModule, MenuController, NavController, 
    ModalController, AlertController } from '@ionic/angular';
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
import { WorkorderModel, WorkorderCreateModel } from '../../../models/workorder-model';
import { WoLaborAddEditModel } from '../../../models/wo-labor-line-model';
import { WoNoteModel } from '../../../models/wo-note-model';

import { MasterTradesModel } from '../../../models/master-trades-model';
import { MasterEquipmentModel } from "../../../models/master-equipment-model";
import { MasterWoTypesModel } from "../../../models/master-wo-types-model";
import { MasterEmployeeModel } from '../../../models/master-employee-model';

//Pages
import { SelEquipmentPage } from '../../selectforms/sel-equipment/sel-equipment.page';
import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-workorder-create',
  templateUrl: './workorder-create.page.html',
  styleUrls: ['./workorder-create.page.scss'],
})
export class WorkorderCreatePage implements OnInit, OnDestroy {

    //component data
    private PageTitle= 'Create Work Order';
  
    //presentation data
    private currWoNum = '';
  
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
  private addWO: WorkorderCreateModel;
  private addLL: WoLaborAddEditModel;
  private addNote: WoNoteModel;

  //private masterTrades: MasterTradesModel[];
  private woTypeCodes:Array<string>;
  private tradeCodes: Array<string>;
  private machineStateCodes: Array<string>;
  private priorityCodes = this.workorderDataSvc.priorityCodes;
  private masterSymptomCodesData = this.masterTableDataSvc.getMasterSymptomCodes();
  private masterCauseCodesData = this.masterTableDataSvc.getMasterCauseCodes();
  private masterRepairCodesData = this.masterTableDataSvc.getMasterRepairCodes();

	private otherButtonClicked = false;
  private clickedSelEmployee = false;
  private formHasChanged = false;
  private addUpdateSucceeded = false; // used to prevent ADD happening a 2nd time
  private dlWoTypes: Array<string> = [];
 
  closePage() {
    //console.log('onCancel', this.connectionSvc.getParentRoot());
    this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
  }

  async onSelectEquipment() {

    var data = { message : '' };
    const modalPage = await this.modalCtrl.create({
      component: SelEquipmentPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from SelEquipmentPage:', rtnValue);
        console.log('Returned from SelEquipmentPage:', rtnValue.data.EquipNum,
        rtnValue.data.Description, rtnValue.data);
        if (rtnValue) {
          this.pageFormGroup.get('equipNum').setValue(rtnValue.data.EquipNum);            
          this.addWO.EquipNumber = rtnValue.data.EquipNum; 
          this.addWO.EquipDesc = rtnValue.data.Description;
        }
      });
    return await modalPage.present();
  } 
  
  async onSelectEmployee() {

    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: SelEmployeePage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from SelEmployeePage:', rtnValue.data);
        if (rtnValue) {
          this.pageFormGroup.get('empNum').setValue(rtnValue.data.EmpNum);            
          this.addWO.EmpName = rtnValue.data.EmpName; 
        }
      });
    return await modalPage.present();
  } 

  
  prepWo2Save() {
    const fV = this.pageFormGroup.value;
    let rtnOk = true;

    // FIRST => PREP WO HEADER 
    // WoNumber set in ionViewDidEnter()
    this.addWO.WoDesc = fV.woDesc;
    this.addWO.EquipNumber = fV.equipNum;
    //* EquipDesc set by change subscription
    this.addWO.WoTypeDesc = fV.woTypeDesc;
    this.addWO.WoTypeId = this.masterTableDataSvc.getWoTypeId(fV.woTypeDesc);

    //this.addWO.PriorityDesc = fV.priorityCode; // not applicable
    this.addWO.PriorityId = Number(fV.priorityCode); //Number(fV.priorityOpt);

    this.addWO.MachineStateDesc = fV.machState;
    this.addWO.MachineStateId = this.masterTableDataSvc.getMachStateId(fV.machState);

    this.addWO.TradeDesc = fV.tradeDesc;
    this.addWO.TradeId = this.masterTableDataSvc.getTradeId(fV.tradeDesc);

    this.addWO.EmpNum = fV.empNum;
    this.addWO.WoNote = fV.note;
    this.addWO.EstHours = fV.estHours;    
    
    this.addWO.AssignedDate = this.utilitiesSvc.getCurrDateTimeStr(); // Req# 174
    this.addWO.AssignedByName = this.applicVarsSvc.getUserFullName();
    this.addWO.AssignedToUserId = this.applicVarsSvc.getLoginUserId();
    this.addWO.CreatedDate = this.utilitiesSvc.getCurrDateTimeStr(); // Req
    this.addWO.LoginFullName = this.applicVarsSvc.getLoginName();
    this.addWO.LoginName = this.applicVarsSvc.getLoginName();
    this.addWO.MobDevUserId = this.applicVarsSvc.getMobDevUserId();
    this.addWO.WoMobStatusId = 1; 
    this.addWO.WoMobStatusDesc = this.workorderDataSvc.woStatusCodes[1];  
    // note: newStatus is handled by formControl change event

    
    this.addWO.CauseCode = fV.causeCode;
    this.addWO.CauseDesc = this.masterTableDataSvc.getCauseCodeText(fV.causeCode);
    this.addWO.RepairCode = fV.repairCode; 
    this.addWO.RepairDesc = this.masterTableDataSvc.getRepairCodeText(fV.repairCode);
    this.addWO.SymptomCode = fV.symptomCode;
    this.addWO.SymptomDesc = this.masterTableDataSvc.getSymptomCodeText(fV.symptomCode);

    this.addWO.UrgentFlag = fV.urgentFlag;

    this.workorderDataSvc.insertWoHeader(this.addWO);

    console.log('**REMOVE data prepped for W/O Header =>',this.addWO);


    // SECOND => PREP WO LABOR LINE 

    this.addLL.WoNumber =this.addWO.WoNumber;
    this.addLL.TradeId =this.addWO.TradeId;
    this.addLL.TradeDesc =this.addWO.TradeDesc;
    this.addLL.Description =this.addWO.WoDesc;
    this.addLL.EstTime =this.addWO.EstHours;
    this.addLL.StartDateTime = this.utilitiesSvc.getCurrDateTimeStr(); // Req# 174
    this.addLL.EmpNum =this.addWO.EmpNum;
    this.addLL.EmpName =this.addWO.EmpName;
    this.addLL.MobLineId = 1;
    this.addLL.MobDispSeq = "1";

    this.workorderDataSvc.addUpdateWoLabor(this.addLL, false, false);

    console.log('**REMOVE data prepped for W/O Labor =>',this.addLL);

 
    // THIRD => PREP WO NOTE
     /* Create W/O NOTE */
    /*
    if (this.addWO.WoNote && this.addWO.WoNote.length > 1) {
      console.log('**REMOVE **WONOTE**', this.addWO.WoNote)
      this.addNote.NoteText = this.addWO.WoNote;
      this.addNote.NoteTags = "Report-Other";
      this.addNote.NoteLinkedToRecType = "W";
      this.addNote.UserId = this.applicVarsSvc.getLoginUserId();
      this.addNote.UserName = this.applicVarsSvc.getLoginName();
      this.addNote.UserFullName = this.applicVarsSvc.getUserFullName();
      this.addNote.MobLineId = 1;
      this.addNote.MobDispSeq = "1";
      this.addNote.CreatedDateTime = this.utilitiesSvc.getCurrDateTimeStr(); //Req# 174
      
      this.workorderDataSvc.addUpdateWoNote(this.addWO.WoNumber, this.addNote, true);

      
    }
    */
    // FINALLY => create a currWO to be sent to the Sync Server
    this.currWO = this.workorderDataSvc.getWorkorder(this.addWO.WoNumber);
  }
  
  onSubmit() {
    const fV = this.pageFormGroup.value;
    if (fV.dateRequired !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.dateRequired)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.dateRequired)+') is invalid.\nPlease try again.');
      return; 
    }
    if (fV.startDate !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.startDate)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.startDate)+') is invalid.\nPlease try again.');
      return;
    }
    this.myLoader.present('Saving changes ...');

    this.prepWo2Save();
    const currWoIdx = 0;// created W/O was inserted at front of W/O array
    const WoArray = this.workorderDataSvc.getWoDataObj();
    /*1*/const currWoInstance = WoArray[currWoIdx]; // created W/O was inserted at front of W/O array
    /*1*/currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
    const LSOname = this.lsoRequestsSvc.workordersLSOname;  
    this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
      .then ((success)=> {
        this.formHasChanged = false;
        this.addUpdateSucceeded = true;
        this.applicVarsSvc.incrementOffLineSeqNum(); /* unique to this update */
        setTimeout(()=>this.closePage(), 200);
        this.myLoader.dismiss();
      }, // (success) {} (after storing in LS)
     (error)=> {alert('Error: could not save WO to local storage');
      this.myLoader.dismiss();}
    ); // end of .then (storing LSO)
  }
   
  async presentAlert() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm add new work order',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 

            console.log('Submitting ...');
            const fV = this.pageFormGroup.value;
            this.myLoader.present('Saving changes ...');

            this.prepWo2Save();
            const currWoIdx = 0;// created W/O was inserted at front of W/O array
            const WoArray = this.workorderDataSvc.getWoDataObj();
            /*1*/const currWoInstance = WoArray[currWoIdx]; // created W/O was inserted at front of W/O array
            /*1*/currWoInstance.DirtyFlag = true; // default is true; reset to false IFF HTTP succeeds
            const LSOname = this.lsoRequestsSvc.workordersLSOname;  
            this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {
                this.formHasChanged = false;
                this.addUpdateSucceeded = true;
                this.applicVarsSvc.incrementOffLineSeqNum(); /* unique to this update */
                setTimeout(()=>this.closePage(), 200);
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

  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }

  getUrgentColor(): string {
    if (this.pageFormGroup.get('urgentFlag').value) return 'danger'
    else return 'button-action'
  }

  ionViewDidEnter() {
    if (!this.masterTableDataSvc.isWoCreateAllowed()) {
      alert('You are not allowed to create a work order. \n Please check with your admin.');
      this.closePage();
    }
    console.log('DID ENTER WorkorderCreatePage!');
    if (this.initialEntry) {
      //this.masterTableDataSvc.loadMissingLargeMTs();
      this.initialEntry = false;
      //this.masterTableDataSvc.loadMissingSmallMTs(); //**REMOVE **/
      /*
      this.masterTableDataSvc.MasterWoTypesData = [
        {WoTypeId: 1,
           WoTypeCode: 'BD',
           WoTypeDesc: 'Building'
        },
        {WoTypeId: 2,
           WoTypeCode: 'GN',
           WoTypeDesc: 'General'
        }
      ]; */

      this.tradeCodes = this.masterTableDataSvc.getTradeCodes();
      this.woTypeCodes = this.masterTableDataSvc.getWoTypeCodes(false);
      this.machineStateCodes = this.masterTableDataSvc.getMachineStateCodes();
      
      // get new W/O #

      const nextWoNum = this.applicVarsSvc.getPrimaryOfflineWoSeqNum();
      const userEmpId = this.applicVarsSvc.getLoginUserId();
      const currWoNum = "M" + userEmpId.toString() + "-" + nextWoNum.toString();
      this.addWO.EmpName = this.applicVarsSvc.getUserFullName();
      const empNum = this.applicVarsSvc.getUserEmpNum();
      this.pageFormGroup.get('empNum').setValue(empNum);
      this.addWO.WoNumber = currWoNum;
      this.PageTitle = 'Add WO# '+currWoNum;

      const currDateStr = this.utilitiesSvc.getCurrDateStr();
      this.addWO.DateRequired = currDateStr;
      this.pageFormGroup.get('dateRequired').setValue(currDateStr);
      this.addWO.StartDate = currDateStr;
      this.pageFormGroup.get('startDate').setValue(currDateStr);
    }
    else
    {
      //this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    }
  }
 
  ngOnInit() {
    this.PageTitle = 'Error: WO-Create';
    this.dlWoTypes = this.masterTableDataSvc.woSecEditWoTypes;
    console.log('--REMOVE masterTableDataSvc.woSecEditWoTypes', this.masterTableDataSvc.woSecEditWoTypes);

    this.pageFormGroup = new FormGroup({
      'woDesc': new FormControl('',[Validators.required]),
      'equipNum': new FormControl('',[Validators.required]),
      'woTypeDesc': new FormControl('',[Validators.required]),      
      'urgentFlag': new FormControl(false),
      'priorityCode': new FormControl(3,[Validators.required]),
      'machState': new FormControl(''),
      'tradeDesc': new FormControl('',[Validators.required]),
      'empNum': new FormControl('',[Validators.required]),
      // 'note': new FormControl(''),
      'symptomCode': new FormControl(''),
      'causeCode': new FormControl(''),
      'repairCode': new FormControl(''),
      'dateRequired': new FormControl(''),
      'startDate': new FormControl(''),
      'estHours': new FormControl(0,[])
    });

    this.addWO = this.workorderDataSvc.createAddWorkorderObject();
    this.addLL = this.workorderDataSvc.createAddEditLaborLineObject();
    this.addNote = this.workorderDataSvc.createNoteLineObject();

    this.route.params
      .subscribe(
        (params: Params) => {
          //this.currWoNum = params['wonum'];
          this.PageTitle = 'Create Workorder';
        },
        () => {
        }
      )
    
    this.pageFormGroup.valueChanges
    .subscribe( (value)=> {this.formHasChanged = true;});

    this.pageFormGroup.get('empNum').valueChanges
      .subscribe( (value )=> {
        this.addWO.EmpName = this.masterTableDataSvc.getEmpName(value);
          ////console.log('Employee Id is ', idValStr, 'Name is', descVal);
      } );

    this.pageFormGroup.get('equipNum').valueChanges
    .subscribe( (value )=> {
      this.addWO.EquipDesc = this.masterTableDataSvc.getEquipDesc(value);
    } );
    this.pageFormGroup.get('dateRequired').valueChanges
    .subscribe( (value )=> {
      if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
        alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
      }
    } );
    this.pageFormGroup.get('startDate').valueChanges
    .subscribe( (value )=> {
      if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
        alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
      }
    } );
    this.pageFormGroup.get('urgentFlag').valueChanges
    .subscribe( (value )=> {
      this.addWO.UrgentFlag = value;
      if (this.addWO.UrgentFlag) {
        this.priorityCodes = [0];
        this.pageFormGroup.get('priorityCode').setValue(0); 
      }
      else 
        if (this.pageFormGroup.get('priorityCode').value() == 0 ) {
          this.pageFormGroup.get('priorityCode').setValue(3);
          this.priorityCodes = this.workorderDataSvc.priorityCodes;
        } 
    } );

  }

  ngOnDestroy() {
  }
}
/*
 <!-- Input WO NOTES -->
    <ion-textarea textarea id="article_text" class="main-desc" type="text" 
     placeholder="Enter a note here"
     formControlName="note" rows="2">
    </ion-textarea>
*/