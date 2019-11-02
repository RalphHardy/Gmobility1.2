import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";

//Services
import { UtilitiesSvc } from '../../../../services/utilities.svc';
import { ConnectionSvc } from '../../../../services/connection.svc';
import { HttpRequestsService } from '../../../../services/http-requests.service';
import { LsoRequestsService } from '../../../../services/lso-requests.service';
import { LoadingService } from '../../../../services/loading.service';
import { ApplicVarsSvc } from '../../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../../services/master-table-data.svc';
import { WorkRequestDataSvc } from '../../../../services/work-request-data.svc';

//Models
import { MasterLocationsModel } from '../../../../models/master-locations-model';
import { WorkRequestModel } from '../../../../models/work-request-model';
import { MasterWorkRequestTypeModel } from '../../../../models/master-workrequest-type-model';
import { MasterDepartmentModel } from '../../../../models/master-department-model';

import { MasterEquipmentModel } from '../../../../models/master-equipment-model';

//Pages
import { SelEquipmentPage } from '../../../selectforms/sel-equipment/sel-equipment.page';

@Component({
  selector: 'app-work-req',
  templateUrl: './work-req.page.html',
  styleUrls: ['./work-req.page.scss'],
})
export class WorkReqPage implements OnInit {

  //processing data
  private currWR: WorkRequestModel;
  private currWrIdx: number = -1;
  private initialEntry = true;
  private allowAdd = true; 
  private allowEdit = true;
  private isEdit = true;

  private equipLocations: MasterLocationsModel[] = this.masterTableDataSvc.getMasterLocations();
  private departments: MasterDepartmentModel[] =  this.masterTableDataSvc.getMasterDepartments();
  private workRequestTypes: MasterWorkRequestTypeModel[] = this.masterTableDataSvc.getMasterWorkRequestTypes();

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
    private WorkRequestDataSvc: WorkRequestDataSvc) {
      this.addWR.EquipDesc = '';
     }

  //presentation data
  private pageFormGroup: FormGroup;
  private formHasChanged = false;

  private masterSymptomCodesData = this.masterTableDataSvc.getMasterSymptomCodes();

  //processing data
  private submitBtnLabel = 'Accept';
  private addWR = this.WorkRequestDataSvc.createWorkRequestObject();


  //component data
  private PageTitle: string = 'Work Request';

 
  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }

  closePage() {
    //console.log('onCancel', this.connectionSvc.getParentRoot());
    //this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
    this.navCtrl.goBack();
  }

  async onSelectEquipment() {

    var data = { message : '' };
    const modalPage = await this.modalCtrl.create({
      component: SelEquipmentPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from SelEquipmentPage:', rtnValue.data.EquipNum,
        rtnValue.data.Description, rtnValue.data);
        if (rtnValue) {
          this.pageFormGroup.get('EquipNumber').setValue(rtnValue.data.EquipNum);   
          this.pageFormGroup.get('EquipDesc').setValue(rtnValue.data.Description);            
          //this.addWR.EquipNumber = rtnValue.data.EquipNum; 
          //this.addWR.EquipDesc = rtnValue.data.Description;
        }
      });
    return await modalPage.present();
  } 
  


  onSubmit() {
    const fV = this.pageFormGroup.value;
    this.myLoader.present('Saving changes ...');

    this.addWR.Description = fV.Description; //** ref: Instructions 
    this.addWR.EquipNumber = fV.EquipNumber; //** ref: EquipmentNum [optional]
    this.addWR.EquipDesc = fV.EquipDesc; // not used by API
    this.addWR.EquipLocId = fV.EquipLocId;
    //this.addWR.EquipLocName = fV.xxx; // not used by API

    this.addWR.PriorityId = fV.PriorityId; //** note: name diff from Enterprise 
    this.addWR.WorkReqTypeId = fV.WorkReqTypeId; 
    this.addWR.WorkReqTypeDesc = this.masterTableDataSvc.getWorkRequestTypeDesc(this.addWR.WorkReqTypeId); // not used by API
    this.addWR.SymptomCode = fV.symptomCode;
    this.addWR.SymptomCodeDesc = this.masterTableDataSvc.getSymptomCodeText(this.addWR.SymptomCode); //** not used by API
    this.addWR.DepartmentId = fV.DepartmentId; //** ref: DepartmentID
    this.addWR.DepartmentDesc = this.masterTableDataSvc.getDepartmentName(this.addWR.DepartmentId); //** not used by API

    this.addWR.Note = fV.Note; //** ref: WorkRequestNotes table (just add one row)
    this.addWR.LoginName = this.applicVarsSvc.getLastLoginName(); 
    this.addWR.LoginFullName = this.applicVarsSvc.getUserFullName();
    this.addWR.SecUserId = this.applicVarsSvc.getLoginUserId(); //** ref: WorkRequestUserID
    this.addWR.RequestedBy = fV.RequestedBy; 
    this.addWR.EmailAddress = fV.EmailAddress; //** ref: Email
    this.addWR.AttentionTo = fV.AttentionTo;  //** ref: Attention

    this.addWR.CreatedDateTime = this.utilitiesSvc.getCurrDateTimeStr(); //** ref: DateTimeEnetered
    this.addWR.DirtyFlag = true; // if True, then not yet sent to server
    this.addWR.Sent2ServerDateTime = '';
    //this.addWR.WorkReqNum = null; // sent back as a result from the API
    const WrArray = this.WorkRequestDataSvc.WRdata;
    console.log('addWR =>', this.addWR);
    if (this.currWrIdx == -1) {// adding NEW Work Request
      WrArray.unshift(this.addWR);  // put newly created W/O at front of W/O array
      const currWoIdx = 0;// created W/O was inserted at front of W/O array
      const currWoInstance = WrArray[currWoIdx]; // created W/O was inserted at front of W/O array

    }
    else {//updating existing one
      this.utilitiesSvc.copyPropertiesObj2Obj(this.addWR, WrArray[this.currWrIdx]);
      console.log('saved changes to W/R ==>', this.WorkRequestDataSvc.WRdata);      
    }
    console.log('**REMOVE, insertWoHeader: WoData=>', WrArray);
    const LSOname = this.lsoRequestsSvc.workRequestsLSOname;  
    
    this.lsoRequestsSvc.storeObj2Lso(WrArray, LSOname)
      .then ((success)=> {
        this.formHasChanged = false;
        
        this.myLoader.dismiss();
        setTimeout(()=>this.closePage(), 500);
      }, // (success) {} (after storing in LS)
     (error)=> {alert('Error: could not save WO to local storage');
      this.myLoader.dismiss();}
    ) // end of .then (storing LSO)
    

  }
  /*
    public Description: string, //** ref: Instructions 
    public EquipNumber: string, //** ref: EquipmentNum [optional]
    public EquipDesc: string, // not used by API
    public EquipLocId: number,
    public EquipLocName: string, // not used by API

    public PriorityId: number, //** note: name diff from Enterprise 
    public WorkReqTypeId: string, 
    public WorkReqTypeDesc: string, // not used by API
    public SymptomCode: string, //** ref: SymptomID
    public SymptomCodeDesc: string, //** not used by API
    public DepartmentId: number, //** ref: DepartmentID
    public DepartmentDesc: string, //** not used by API

    public Note: string, //** ref: WorkRequestNotes table (just add one row)
    public LoginName: string, 
    public LoginFullName: string,
    public SecUserId: number, //** ref: WorkRequestUserID
    public RequestedBy: string, 
    public EmailAddress: string, //** ref: Email
    public AttentionTo: string,  //** ref: Attention

    public CreatedDateTime: string, //** ref: DateTimeEnetered
    public DirtyFlag: boolean, // if True, then not yet sent to server
    public Sent2ServerDateTime: string,
    public WorkReqNum: string, // sent back as a result from the API
    
    public WoAttachFiles: WoAttachFilesModel[]
  */

  ionViewDidEnter() {
    if (this.workRequestTypes.length > 0) {
      this.pageFormGroup.get('WorkReqTypeId').setValue(this.workRequestTypes[0]['WorkReqTypeId']);
    }
    const fV = this.pageFormGroup;
    fV.get('Description').setValue(this.addWR.Description); 
    fV.get('EquipNumber').setValue(this.addWR.EquipNumber); //*
    fV.get('EquipDesc').setValue( this.addWR.EquipDesc); 
    fV.get('EquipLocId').setValue(this.addWR.EquipLocId); 
    fV.get('DepartmentId').setValue(this.addWR.DepartmentId); 
    fV.get('PriorityId').setValue(this.addWR.PriorityId); 
    fV.get('WorkReqTypeId').setValue(this.addWR.WorkReqTypeId); 
    fV.get('SymptomCode').setValue(this.addWR.SymptomCode); 
    fV.get('Note').setValue(this.addWR.Note); 
    fV.get('EmailAddress').setValue(this.addWR.EmailAddress);
    fV.get('AttentionTo').setValue(this.addWR.AttentionTo); 
    fV.get('RequestedBy').setValue(this.addWR.RequestedBy); 
  }

  ngOnInit() {
    this.pageFormGroup = new FormGroup({     
      'Description': new FormControl(''),
      'EquipNumber': new FormControl(''),
      'EquipDesc': new FormControl(null),
      'EquipLocId': new FormControl(null),
      'DepartmentId': new FormControl(0),
      'PriorityId': new FormControl(3,[Validators.required]),
      'WorkReqTypeId': new FormControl('',[Validators.required]),
      'SymptomCode': new FormControl(''),
      'Note': new FormControl(''),
      'EmailAddress': new FormControl(''),
      'AttentionTo': new FormControl(''),
      'RequestedBy': new FormControl(this.applicVarsSvc.getUserFullName())
      //'chgStatusDesc': new FormControl('')
    });
    
    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWrIdx = params['idx'];
          if (this.currWrIdx == -1) {            
            this.PageTitle = 'Create Work Request'
          } 
          else {
            this.utilitiesSvc.copyPropertiesObj2Obj(this.WorkRequestDataSvc.WRdata[this.currWrIdx],this.addWR );
            console.log('**REMOVE this.addWR =>', this.currWrIdx, this.WorkRequestDataSvc.WRdata[this.currWrIdx], this.addWR);
            this.PageTitle = 'Work Request Edit ['+this.currWrIdx.toString()+']';

          }
          //this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          // Now create an "Add" workorder object and then copy the prop values from the stored one...
          //this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO, this.editWO);
          //console.log('wonum->', this.currWoNum, this.editWO);
        },
        () => {
        }
      )

      this.pageFormGroup.valueChanges
      .subscribe( (value)=> {this.formHasChanged = true;});
  
      this.pageFormGroup.get('EquipNumber').valueChanges
      .subscribe( (value )=> {
        this.addWR.EquipDesc = this.masterTableDataSvc.getEquipDesc(value);
      } );
      this.pageFormGroup.get('EquipLocId').valueChanges
        .subscribe( (value )=> {
          this.addWR.EquipLocName = this.masterTableDataSvc.getLocationName(value);
          console.log('EquipLocName Id is ', value, 'Name is', this.addWR.EquipLocName);
        } );
  
  }

}
/*
      <!-- Input NOTE  -->
      <ion-textarea textarea id="article_text" class="main-desc" type="text" 
      placeholder="Enter note here"
      formControlName="Note" rows="4">
      </ion-textarea>

*/