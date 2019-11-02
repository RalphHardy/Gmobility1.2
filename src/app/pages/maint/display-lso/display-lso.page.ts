import { Component, OnInit } from '@angular/core';

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
import { MasterTradesModel } from '../../../models/master-trades-model';
import { MasterLocationsModel } from '../../../models/master-locations-model';
import { MasterWarehouseModel } from '../../../models/master-locations-model';
import { MasterMachineStatesModel } from '../../../models/master-machine-states-model';
import { MasterWoTypesModel } from '../../../models/master-wo-types-model';
import { MasterMeasureUnitsModel } from '../../../models/master-measure-units-model';
import { MasterCauseCodesModel } from '../../../models/master-cause-rep-codes-model';
import { MasterRepairCodesModel } from '../../../models/master-cause-rep-codes-model';
import { MasterSymptomCodesModel } from '../../../models/master-cause-rep-codes-model';
import { MasterWorkRequestTypeModel } from '../../../models/master-workrequest-type-model';
import { MasterDepartmentModel } from '../../../models/master-department-model';
import { MasterWoSecurityModel } from '../../../models/master-wo-security-model';


import { MasterCatalogModel } from '../../../models/master-catalog-model';
import { MasterEmployeeModel } from "../../../models/master-employee-model";
import { MasterStockBinLocModel } from "../../../models/master-catalog-model";
import { MasterEquipmentModel } from "../../../models/master-equipment-model";
import { MasterSupplierModel } from "../../../models/master-supplier-model";




//Pages
//import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
import { DELEGATE_CTOR } from '@angular/core/src/reflection/reflection_capabilities';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-display-lso',
  templateUrl: './display-lso.page.html',
  styleUrls: ['./display-lso.page.scss'],
})
export class DisplayLsoPage implements OnInit {
  //component data
  private PageTitle: string = 'Display Local Storage Tables';

  //presentation data
  private displayAttachments: string = "";
  private displayImages: string = "";

  //processing data

  constructor(
    private menuCtrl: MenuController,
    private viewCtrl: ModalController,
    private navCtrl: NavController,
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


    private Trades: MasterTradesModel[];
    private Locations: MasterLocationsModel[];
    private Warehouses: MasterWarehouseModel[];
    private MachineStates: MasterMachineStatesModel[];
    private MeasureUnits: MasterMeasureUnitsModel[];
    private CauseCodes: MasterCauseCodesModel[];
    private RepairCodes: MasterRepairCodesModel[];
    private SymptomCodes: MasterSymptomCodesModel[];
    private WoTypes: MasterWoTypesModel[] = [];
    public Departments: MasterDepartmentModel[] = [];
    public WorkRequestTypes: MasterWorkRequestTypeModel[] = [];
    public WoSecurity: MasterWoSecurityModel[] = [];
    private LsoTables: any = [];
    private Workorders: WorkorderModel[] = [];


    private Catalog: MasterCatalogModel[];
    private Employees: MasterEmployeeModel[];
    private SkuBins: MasterStockBinLocModel[];
    private Equipment: MasterEquipmentModel[];
    private Suppliers: MasterSupplierModel[];

    private localStorageTables: Array<string> = [];
    private selectTable = 'Trades';

  
  closePage() {
    console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }



  ionViewDidEnter() {
    
    this.myLoader.dismiss();
  }

  ngOnInit() {
    if (!this.connectionSvc.isLoggedIn()) {
      alert('WARNING! You should be logged in to view Local Storage Tables');

    }
    this.myLoader.present('Retrieving data ...');
    this.localStorageTables = this.masterTableDataSvc.masterTableList;
    this.localStorageTables.push(...['WorkRequestTypes', 'workorders',
      'Attachments', 'Images']);

    this.LsoTables = this.lsoRequestsSvc.listLocalStorageTables();
    console.log('this.LsoTables',this.LsoTables);

    //this.Trades = this.masterTableDataSvc.getMasterTrades();

    this.masterTableDataSvc.loadAllSmallMasterTables();

  
    setTimeout(()=>{
    this.Locations = this.masterTableDataSvc.getMasterLocations();
    this.Trades = this.masterTableDataSvc.getMasterTrades();
    this.Warehouses = this.masterTableDataSvc.getMasterWarehouses();
    this.MachineStates = this.masterTableDataSvc.getMasterMachineStates();
    setTimeout(()=>{
      this.MeasureUnits = this.masterTableDataSvc.getMasterMeasureUnits();
      this.CauseCodes = this.masterTableDataSvc.getMasterCauseCodes();
      this.RepairCodes = this.masterTableDataSvc.getMasterRepairCodes();
      this.SymptomCodes = this.masterTableDataSvc.getMasterSymptomCodes();
      this.WoTypes = this.masterTableDataSvc.getMasterWoTypes();
      this.Departments = this.masterTableDataSvc.getMasterDepartments();
      this.WoSecurity = this.masterTableDataSvc.getMasterWoSecurity();
      this.WorkRequestTypes = this.masterTableDataSvc.getMasterWorkRequestTypes();
    },500);
  }, 2000);

    
    this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workordersLSOname)
    .then ((woData)=> {  
      this.Workorders.length = 0;
      for ( let wo in woData ) {
        const currWo = woData[wo];
        this.Workorders.push(currWo);
      }        
    } );

    this.lsoRequestsSvc.getDataFromLocalStorage('attachments')
    .then ((data)=> {  
      this.displayAttachments = JSON.stringify(data);
      //console.log('Attachments =>', data, this.displayAttachments );
    } );

    this.lsoRequestsSvc.getDataFromLocalStorage('images')
    .then ((data)=> {  
      this.displayImages = JSON.stringify(data);
    } );

    
    setTimeout( ()=> {
      this.masterTableDataSvc.loadMasterCatalog();
      setTimeout( ()=> {
        this.Catalog = this.masterTableDataSvc.getMasterCatalog();
        this.masterTableDataSvc.loadMasterEmployee();
        setTimeout( ()=> {
          this.Employees = this.masterTableDataSvc.getMasterEmployee();
          this.masterTableDataSvc.loadMasterEquipment();
          setTimeout( ()=> {
            this.Equipment = this.masterTableDataSvc.getMasterEquipment();
            this.masterTableDataSvc.loadMasterWarehouseBins();
            setTimeout( ()=> {
              this.SkuBins = this.masterTableDataSvc.getMasterWarehouseBins();
              this.masterTableDataSvc.loadMasterSuppliers();
              setTimeout( ()=> {
                this.Suppliers = this.masterTableDataSvc.getMasterSuppliers();
                
              }
              ,2000); //Suppliers
            }
            ,2000); // SkuBins
          }
          ,3000); // Equipment}
        }
        ,3000); // Employees
      }
      ,4000); // Catalog
    }
    ,3000);


  }

}
