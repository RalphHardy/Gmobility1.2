import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

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
import { WoMaterialLineModel } from '../../../models/wo-material-line-model';
import { MasterCatalogModel, MasterStockBinLocModel, CatalogSearchModel } from "../../../models/master-catalog-model";
import { MasterWarehouseModel } from '../../../models/master-locations-model';
import { MasterEmployeeModel } from '../../../models/master-employee-model';
import { MasterMeasureUnitsModel } from '../../../models/master-measure-units-model';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

//Pages
import { SelSkucodePage } from  '../../selectforms/sel-skucode/sel-skucode.page';
import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';

@Component({
  selector: 'app-wo-material-edit',
  templateUrl: './wo-material-edit.page.html',
  styleUrls: ['./wo-material-edit.page.scss'],
})
export class WoMaterialEditPage implements OnInit {
  //component data
  private PageTitle: string = '';

  constructor(
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private modalCtrl2: ModalController,
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
    private workorderDataSvc: WorkorderDataSvc,
    //plugin
    private barcodeScanner: BarcodeScanner) { }

  //presentation data
  private pageFormGroup: FormGroup;
  private addEditLabel: string = ' Edit ';
  private submitBtnLabel = 'Accept';
  private formHasChanged = true;
  private currWoNum = '';
  private matLineId = 0;
  private acqMethods = [{code: "1", desc: "inventory"}, {code: "2", desc: "P.O. Purchase"}, 
    {code: "3", desc: "Purchased on Account"}, {code: "4", desc: "Purchased by Employee"}, 
    {code: "5", desc: "Purchased on Co. CC"}];
  private acquisitionMethods = ['Inventory', 'P.O. Purchase', 'Purchased on Account', 
    'Purchased by Employee', 'Purchased on Co. CC'];
	private acqMethodCodes4NonInv = "2345"; 
	private acqMethodDropDownList = [] = this.acquisitionMethods; // default
	private suppliersDropDownList = [] = this.masterTableDataSvc.getMasterSuppliers();
  private skuCatInfo: MasterCatalogModel;
  private skuWarehouseBin: MasterStockBinLocModel;
	private masterWarehouses: MasterWarehouseModel[] = this.masterTableDataSvc.getMasterWarehouses();
	private masterWarehouseBins: MasterStockBinLocModel[] = this.masterTableDataSvc.getMasterWarehouseBins();
	private masterUoM: MasterMeasureUnitsModel[] = this.masterTableDataSvc.getMasterMeasureUnits();

  private minInputDateStr = this.utilitiesSvc.addDays2CurrDateRtnStr(-11);
  private currDateStr = this.utilitiesSvc.getCurrDateStr();

  //processing data
  private currWO: WorkorderModel;
  private addEditML: WoMaterialLineModel = this.workorderDataSvc.createMaterialLineObject();
  private initialEntry = true;
  private allowEdit = true;
  private isEdit = true;

  private isInventory: boolean = true;  
  private isPoPurchase: boolean = false; 
  private isNonPoPurchase: boolean = false; 
  private searchResult: CatalogSearchModel[] = []; 
	private binNumsDropDownList: Array<string> = []; //this.masterTableDataSvc.getListOfBins();     

  
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
          this.addEditML.EmpName = rtnValue.data.EmpName; 
        }
      }); 
    return await modalPage.present();
  } 

  prepWo2Save(): number{
    const fV=this.pageFormGroup.value;

    this.addEditML.SkuCode = fV.skuCode;
    this.searchResult = this.masterTableDataSvc.loadSearchCatalogArray(fV.skuCode, '', '', '', '');
    this.addEditML.SkuDescription = this.searchResult[0].ItemDesc;
    this.addEditML.SkuCategory = this.searchResult[0].SkuCategory;

    this.addEditML.QtyPickedUp = fV.qtyPickedUp;
    this.addEditML.QtyUsed = fV.qtyUsed;
    this.addEditML.UsageDate = fV.usageDate;
    this.addEditML.Warehouse = fV.warehouse;
    this.addEditML.Bin = fV.binNum;

    this.addEditML.EmpNum = fV.empNum;
    this.addEditML.EmpName = this.masterTableDataSvc.getEmpName(fV.empNum);
    this.addEditML.AcquisitionMethodDesc = this.acquisitionMethods[Number(fV.acqMethodCode)-1];
    this.addEditML.AcquisitionMethodCode = fV.acqMethodCode;
    this.addEditML.AcquisitionInfo = fV.acqInfo; 
    this.addEditML.SupplierCode = fV.supplierCode; // desc
    this.addEditML.PurchPrice = fV.unitPrice;
    this.addEditML.UnitOfMeasure = fV.unitOfMeasure;
    console.log('data prepped for W/O Update =>',this.addEditML);

 /*1*/ return this.workorderDataSvc.addUpdateWoMaterial(this.currWoNum, this.addEditML, this.isEdit);
  }
   
  onSubmit() {
    var ok = true; 
    const fV = this.pageFormGroup.value;
    if (fV.usageDate !== "" && !this.utilitiesSvc.validateDaysOfMonth(fV.usageDate)) {
      alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(fV.usageDate)+') is invalid.\nPlease try again.');
      return;
    }

    //console.log('this.addEditML.AcquisitionMethodCode',this.addEditML.AcquisitionMethodCode);
    if ( (this.addEditML.Source == "Inventory") || (this.addEditML.AcquisitionMethodCode == "1") ) {
      this.skuCatInfo = this.masterTableDataSvc.getCatalogInfo4Sku(this.addEditML.SkuCode);
      if (this.skuCatInfo.IsStockItem) {
        if (!this.masterTableDataSvc.validSkuWarehouseBin(this.pageFormGroup.get('skuCode').value, 
         this.pageFormGroup.get('warehouse').value, this.pageFormGroup.get('binNum').value)) {
          ok = false; alert('Warehouse/Bin not valid for Material Item: '+this.pageFormGroup.get('skuCode').value);
        }
      }
    }
    else { // not Inventory }
      if (this.addEditML.AcquisitionMethodCode != "2") { // non-po
        if (fV.empNum == "") {
          ok = false; alert('Please enter an Employee for Non-p/o purchases.');
        }
        else if (fV.unitPrice == 0) {
          ok = false; alert('Please enter a unit price for Non-p/o purchases.');
        }
      }
      else { // Acq == 2 P.O. purchase
        if (!fV.acqInfo || fV.acqInfo =="") {
          ok = false; alert('You must enter a P.O. No.');
        }
      }
    }
    //if (this.needAcqInfo) {
     // ok = false; alert('Acquisition Info needed. Please click the area under that title.');
    //}
    if ( (ok) && (this.pageFormGroup.valid) ) {
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
          //if (!this.isEdit) this.closePage(); // if Add, then go to previous page
          this.myLoader.dismiss();
        }, // (success) {} (after storing in LS)
      (error)=> {alert('Error: could not save WO to local storage');
        this.myLoader.dismiss();}
      ) // end of .then (storing LSO)
    } // if OK & Form-fields are valid
  }

  async presentAlert() {

    var ok = true; // ** TESTING false only
    const fV = this.pageFormGroup.value;
    console.log('this.addEditML.AcquisitionMethodCode',this.addEditML.AcquisitionMethodCode);
    if ( (this.addEditML.Source == "Inventory") || (this.addEditML.AcquisitionMethodCode == "1") ) {
      this.skuCatInfo = this.masterTableDataSvc.getCatalogInfo4Sku(this.addEditML.SkuCode);
      if (this.skuCatInfo.IsStockItem) {
        if (!this.masterTableDataSvc.validSkuWarehouseBin(this.pageFormGroup.get('skuCode').value, 
         this.pageFormGroup.get('warehouse').value, this.pageFormGroup.get('binNum').value)) {
          ok = false; alert('Warehouse/Bin not valid for Material Item: '+this.pageFormGroup.get('skuCode').value);
        }
      }
    }
    else { // not Inventory }
      if (this.addEditML.AcquisitionMethodCode != "2") { // non-po
        if (fV.empNum == "") {
          ok = false; alert('Please enter an Employee for Non-p/o purchases.');
        }
        else if (fV.unitPrice == 0) {
          ok = false; alert('Please enter a unit price for Non-p/o purchases.');
        }
      }
    }
    //if (this.needAcqInfo) {
     // ok = false; alert('Acquisition Info needed. Please click the area under that title.');
    //}
    if ( (ok) && (this.pageFormGroup.valid) ) {
      const confirmAlert = await this.alertCtrl.create({
        header: 'Alert',
        message: 'Confirm'+this.addEditLabel+' Material line',
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
                  this.setIsEditBasedData();
                  //if (!this.isEdit) this.closePage(); // if Add, then go to previous page
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
    } // ok
  }

  closePage() {
    //console.log('onCancel', this.connectionSvc.getParentRoot());
    this.navCtrl.navigateBack(this.connectionSvc.getParentRoot());
  }

  onScanItem() {
    const scanOpts = {
        preferFrontCamera : false, // iOS and Android
        showFlipCameraButton : false, // iOS and Android
        showTorchButton : true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: false, // Android, save scan history (default false)
        prompt : "Place barcode within frame", // Android
        resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        formats : "UPC_A, QR_CODE, CODE_39", // default: all but PDF_417 and RSS_EXPANDED
        //orientation : "landscape", //Android only (portrait|landscape), default unset so it rotates with the device
        disableAnimations : true, // iOS
        disableSuccessBeep: false // iOS and Android
    }
    this.barcodeScanner.scan(scanOpts)
    .then ((result)=>{
      //alert("Barcode scanned...\n" +"Result: " + result.text + "\n" +"Format: " + result.format + "\n" +"Cancelled: " + result.cancelled);
      const skuCodeIdx = this.masterTableDataSvc.findSkuInCatalog(result.text);
      //alert ('skuCodeIdx: '+skuCodeIdx.toString()); 
      if (skuCodeIdx > -1) {
        this.setSkuAndRelatedItems(result.text);
      }
    },
      (err)=>{
        alert("Scanning failed: " + err);})    
  }
 
  setSkuAndRelatedItems(skuCode: string) {
    this.pageFormGroup.get('skuCode').setValue(skuCode);  
    this.addEditML.SkuCode = skuCode;
    this.addEditML.SkuDescription = skuCode; 
    this.skuCatInfo = this.masterTableDataSvc.getCatalogInfo4Sku(skuCode);
    //console.log('1-Found Catalog Info for skucode: ', rtnValue.SkuCode, this.skuCatInfo);
    if (this.skuCatInfo.SkuCode == skuCode) {
      ////console.log('2-Found Catalog Info for skucode: ', this.skuCatInfo);
      if (this.skuCatInfo.IsStockItem) {
        this.skuWarehouseBin = this.masterTableDataSvc.getSkuWarehouseBin(this.addEditML.SkuCode);
        //console.log('3-Found Sku Warehouse/Bin  for skucode: ', this.skuWarehouseBin);
        this.pageFormGroup.get('warehouse').setValue(this.skuWarehouseBin.Warehouse);
        this.addEditML.Warehouse = this.skuWarehouseBin.Warehouse;
        this.pageFormGroup.get('binNum').setValue(this.skuWarehouseBin.BinNum);
        this.addEditML.Bin = this.skuWarehouseBin.BinNum;
       
        // find warehouse bin for the skuCode ...
        //this.pageFormGroup.get('warehouse').setValue(this.skuCatInfo.)
      }
    }

  }

  async onSelectCatItem() {
    var data = { skuCode : this.pageFormGroup.get('skuCode').value};

    const modalPage = await this.modalCtrl2.create({
      component: SelSkucodePage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from SelSkucodePage:', rtnValue.data);
        if (rtnValue && rtnValue.data.SkuCode != "") {
          this.setSkuAndRelatedItems(rtnValue.data.SkuCode);
        }
      });
    return await modalPage.present();
  } 

  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }
	onClearDate() {
    this.pageFormGroup.get('usageDate').setValue('');
  }


  setIsEditBasedData(){
    this.PageTitle = 'WO '+this.currWoNum+' Material ('+this.matLineId.toString()+')';
    this.addEditLabel = ' Edit ';
    if (!this.isEdit) this.isEdit = true;
    this.submitBtnLabel = 'Accept Edit';

    setTimeout(()=>this.formHasChanged = false, 300);
  }



  ionViewDidEnter() {
    if (this.initialEntry) { // only perform this for original entry (following ngInit)
      this.initialEntry = false;
      if (this.isEdit) {     
 
        this.pageFormGroup.get('skuCode').setValue(this.addEditML.SkuCode);
        this.pageFormGroup.get('qtyPickedUp').setValue(this.addEditML.QtyPickedUp);
        this.pageFormGroup.get('qtyUsed').setValue(this.addEditML.QtyUsed);
        this.pageFormGroup.get('acqMethodCode').setValue(this.addEditML.AcquisitionMethodCode);
        this.pageFormGroup.get('usageDate').setValue(this.addEditML.UsageDate);
        this.pageFormGroup.get('warehouse').setValue(this.addEditML.Warehouse);
        //this.pageFormGroup.get('binNum').setValue(this.addEditML.Bin);
        /* */
        if (this.addEditML.AcquisitionMethodCode == '1' && this.addEditML.Warehouse !== "") {
          if (this.addEditML.Bin !=="") {     
            this.binNumsDropDownList = this.masterTableDataSvc.getBinNums4WhseSkuCode(this.addEditML.Warehouse, this.addEditML.SkuCode);
          }
        }
        /* */
        if (this.utilitiesSvc.debugReq(167)) console.log('setting binNum value', this.addEditML.Bin, this.pageFormGroup.get('binNum').value,
          'binDropDownList =>', this.binNumsDropDownList);
        this.pageFormGroup.get('empNum').setValue(this.addEditML.EmpNum);
        this.pageFormGroup.get('acqInfo').setValue(this.addEditML.AcquisitionInfo);
        this.pageFormGroup.get('supplierCode').setValue(this.addEditML.SupplierCode);
        this.pageFormGroup.get('unitPrice').setValue(this.addEditML.PurchPrice);
        this.pageFormGroup.get('unitOfMeasure').setValue(this.addEditML.UnitOfMeasure);

        if ( (this.addEditML.AcquisitionMethodCode == "") // line created by Ent. not yet edited on app
        && (this.addEditML.Source == "Inventory") ) {
            this.addEditML.AcquisitionMethodCode = "1";
            this.pageFormGroup.get('acqMethodCode').setValue("1");
        }	
          
        this.setIsEditBasedData();
      }
      else { // adding new Material Line
        this.submitBtnLabel = "Accept Add"; 
        const userId = this.applicVarsSvc.getLoginUserId();
        const empNum = this.applicVarsSvc.getUserEmpNum();
        this.addEditML.EmpName = this.masterTableDataSvc.getEmpName(empNum);
        this.pageFormGroup.get('empNum').setValue(empNum);
        this.addEditML.MobLineId = this.workorderDataSvc.findNextMobLineId(this.currWO.WoMaterialLines);
        this.addEditML.MobDispSeq = this.addEditML.MobLineId.toString(); 
        
        //this.pageFormGroup.get('acqMethodCode').setValue("1"); //default on New Material Line
        if (this.masterWarehouses.length > 0) {
          this.pageFormGroup.get('warehouse').setValue(this.masterWarehouses[0].Warehouse); //default on New Material Line
        }
        const lastIdx = this.acquisitionMethods.length-1;
            
        this.pageFormGroup.get('acqMethodCode').setValue("1"); 

        if ( this.addEditML.EmpNum == "" ) {	
          this.addEditML.EmpNum = this.applicVarsSvc.getUserEmpNum(); // default to User's Employee No.
          this.addEditML.EmpName = this.masterTableDataSvc.getEmpName(this.addEditML.EmpNum);	
        }	
        this.pageFormGroup.get('empNum').setValue(this.addEditML.EmpNum);	

        if ( (this.addEditML.UnitOfMeasure.length == 0) && (this.masterUoM.length>0) ) {
          this.addEditML.UnitOfMeasure = this.masterUoM[0].UomCode;
          this.pageFormGroup.get('unitOfMeasure').setValue(this.addEditML.UnitOfMeasure);
        }	
      }
      this.allowEdit = this.currWO.WoMobStatusId < 4;
      setTimeout(()=>this.formHasChanged = false, 300);
    }
}
   
  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'skuCode': new FormControl('',[Validators.required]),
      'qtyPickedUp': new FormControl(0, []),
      'qtyUsed': new FormControl(0, []),
      'usageDate': new FormControl(this.currDateStr,[Validators.required]),
      'warehouse': new FormControl('',[]),
      'binNum': new FormControl('',[]),
      'empNum': new FormControl('',[Validators.required]),
      'acqMethodCode': new FormControl('1', [Validators.required]),
      'acqInfo': new FormControl(''),
      'supplierCode': new FormControl(''),
      'unitPrice': new FormControl(0.00),
      'unitOfMeasure': new FormControl('')
    });

    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.matLineId= params['line'];
          this.isEdit = (this.matLineId > 0); 
          this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          this.allowEdit = this.currWO.WoMobStatusId < 4;
 
          console.log('currWO =>', this.currWO);
          const idxML = 
            this.workorderDataSvc.getIdxFromMobLineId(this.matLineId, this.currWO.WoMaterialLines);
          console.log('*** idxML =>', idxML);
          if (this.isEdit) {
            //console.log('wonum->', this.currWoNum, ', line:', this.matLineId, this.currWO.WoMaterialLines[idxML]);
            this.utilitiesSvc.copyPropertiesObj2Obj(this.currWO.WoMaterialLines[idxML], this.addEditML);
            this.pageFormGroup.get('binNum').setValue(this.addEditML.Bin);
            console.log('this ML ->', this.addEditML);
          } 
          else {
            this.PageTitle = 'WO '+this.currWoNum+' Add Material';
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
        if (this.isEdit) {this.submitBtnLabel = "Submit Edit"}
        else {this.submitBtnLabel = "Submit Add"}
      } );

      this.pageFormGroup.get('skuCode').valueChanges
      .subscribe( (value )=> { // OnChange(skuCode)
        /* */
        this.addEditML.SkuDescription = this.masterTableDataSvc.getSkuDesc(value);
        if (this.utilitiesSvc.debugReq(167)) console.log('CHANGED: skucode: ', this.pageFormGroup.get('skuCode').value);
        // look up warehouse
        if (this.pageFormGroup.get('warehouse').value =="") {
          if (this.masterWarehouses.length > 0) {
            this.pageFormGroup.get('warehouse').setValue(this.masterWarehouses[0].Warehouse); //default on New Material Line
          }
          // find default warehouse

          // create bin dropdown list

        }
        if (this.pageFormGroup.get('warehouse').value !== "") {
          this.binNumsDropDownList =
            this.masterTableDataSvc.getBinNums4WhseSkuCode(this.pageFormGroup.get('warehouse').value, 
                this.pageFormGroup.get('skuCode').value);
          if (this.binNumsDropDownList.length === 1 && this.addEditML.Bin !== this.binNumsDropDownList[0]) {
            if (this.utilitiesSvc.debugReq(167)) console.log('onChange(skuCode) BEFORE:', this.pageFormGroup.get('binNum').value);
            //this.pageFormGroup.get('binNum').setValue(this.binNumsDropDownList[0]); 
            if (this.utilitiesSvc.debugReq(167)) console.log('onChange(skuCode) AFTER:', this.pageFormGroup.get('binNum').value);
          } 
          if (this.utilitiesSvc.debugReq(167)) console.log('***BIN DROPDOWN LIST = ', 	this.binNumsDropDownList,
            'value = ', this.pageFormGroup.get('binNum').value);
        }
        /* */
      } );

      this.pageFormGroup.get('warehouse').valueChanges
      .subscribe( (value )=> {
        if (this.pageFormGroup.get('warehouse').value !== "" && this.pageFormGroup.get('warehouse').value !== this.addEditML.Warehouse) {          
          this.binNumsDropDownList =
              this.masterTableDataSvc.getBinNumsBegWith('', this.pageFormGroup.get('warehouse').value);
              if (this.utilitiesSvc.debugReq(167)) console.log('onChange(warehouse) ***BIN DROPDOWN LIST = ', 	this.binNumsDropDownList,
                'value = ', this.pageFormGroup.get('binNum').value);              
        }
      } );
      this.pageFormGroup.get('usageDate').valueChanges
      .subscribe( (value )=> {
        if (value !== "" && !this.utilitiesSvc.validateDaysOfMonth(value)) {
          alert('Date entered ('+this.utilitiesSvc.getSmallDateFromDTstr(value)+') is invalid.\nPlease try again.');
        }
      } );

      

      this.pageFormGroup.get('acqMethodCode').valueChanges
      .subscribe( (value )=> {
        const acqCode = (this.pageFormGroup.get('acqMethodCode').value); 
        this.isInventory = (acqCode == '1');   
        this.isPoPurchase = (acqCode == '2');  
        this.isNonPoPurchase = (Number(acqCode) > 2); 
        this.addEditML.AcquisitionMethodCode = acqCode;
        //console.log('**REMOVE: acqMethodDesc HasChanged, acqCode =', acqCode,', is Inventory=', this.isInventory); 
        
        if (this.isInventory) {        
          //this.binNumsDropDownList =
              //this.masterTableDataSvc.getBinNumsBegWith('', this.addEditML.Warehouse);
        }     
      } ); // OnChange(acqMethodCode)

      this.pageFormGroup.get('empNum').valueChanges
      .subscribe( (value )=> {
        this.addEditML.EmpName = this.masterTableDataSvc.getEmpName(value);
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
    <ion-label fixed> <b>Date Used:</b></ion-label>
    <ion-datetime  formControlName="usageDate" 
      display-format="DD-MMM-YYYY"
      min="{{minInputDateStr}}"
      max="{{currDateStr}}" >
    </ion-datetime>
  */