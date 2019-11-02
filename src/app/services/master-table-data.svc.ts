import { Injectable, OnDestroy, TRANSLATIONS_FORMAT } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

//Services
import { HttpRequestsService } from '../services/http-requests.service';
import { LsoRequestsService } from '../services/lso-requests.service';
import { UtilitiesSvc } from '../services/utilities.svc';
import { LoadingService } from './loading.service';
import { ConnectionSvc } from './connection.svc';
import { ApplicVarsSvc } from './applic-vars.svc';
import { MtSubscriptionService } from './mt-subscription.service';

//Models
import { genericDropdownElModel } from "../models/utility-models";
import { MasterEquipmentModel } from "../models/master-equipment-model";
import { MasterCatalogModel, CatalogAltBarcodeModel } from "../models/master-catalog-model"; 
import { MasterStockBinLocModel } from "../models/master-catalog-model";
import { CatalogSearchModel } from "../models/master-catalog-model";
import { EmployeeSearchModel } from "../models/master-employee-model";
import { MasterEmployeeModel } from "../models/master-employee-model";
import { MasterTradesModel } from '../models/master-trades-model';
import { MasterLocationsModel } from '../models/master-locations-model';
import { MasterWarehouseModel } from '../models/master-locations-model';
import { MasterMachineStatesModel } from '../models/master-machine-states-model';
import { MasterWoTypesModel } from "../models/master-wo-types-model";
import { MasterMeasureUnitsModel } from '../models/master-measure-units-model';
import { MasterCauseCodesModel } from '../models/master-cause-rep-codes-model';
import { MasterRepairCodesModel } from '../models/master-cause-rep-codes-model';
import { MasterSymptomCodesModel } from '../models/master-cause-rep-codes-model';
import { MasterSupplierModel } from '../models/master-supplier-model';
import { MasterWorkRequestTypeModel } from '../models/master-workrequest-type-model';
import { MasterDepartmentModel } from '../models/master-department-model';
import { MasterWoSecurityModel } from '../models/master-wo-security-model';
import { TableMaintenanceModel, LastReloadedInfo } from '../models/utility-models';

//Data
import { environment } from '../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Injectable({
  providedIn: 'root'
})
export class MasterTableDataSvc {

  constructor(      
    private http: HttpClient,
    private storage: Storage,
    private myLoader1: LoadingService,
    private myLoader2: LoadingService,
    private alertCtrl: AlertController,
    private utilitiesSvc: UtilitiesSvc,
    private applicVarsSvc:ApplicVarsSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private MtSubscriptionSvc: MtSubscriptionService,
    private myLoader: LoadingService) {  

        // to be executed upon creation of MasterTableDataSvc...      
        this.triggerGetStoreNextLargeMTSubscription = this.MtSubscriptionSvc.triggerGetStoreNextLargeMT 
        .subscribe(
        (mtIdx) =>  {
            var retrieveMtFromServer = 
                (this.loadLargeMtCmd !== 'missing' || this.missingLargeMTs.indexOf(mtIdx)>-1);
            //console.log('checking retrieveMtFromServer:', retrieveMtFromServer, mtIdx,this.missingLargeMTs, this.loadLargeMtCmd);
            const url = this.httpRequestsSvc.getSiteServerUrl();
            const lsoSuffix = '-'+this.lsoRequestsSvc.syncDbName;
            //console.log('lsoSuffix', lsoSuffix);
            const tblName = this.masterTableList[mtIdx];
            //console.log('tblName', tblName);
            const LSOname = this.getMTlsoName(mtIdx);
            //console.log('LSOname', LSOname);

            if (retrieveMtFromServer) {
                
                this.myLoader.present('Retrieving data from '+tblName);
                this.httpRequestsSvc.handleGetRequest(url+tblName, true)
                .subscribe(
                (data) => { 
                    if (data === null) {
                        this.myLoader.dismiss();
                        alert('REPORT THIS ERROR: MT-DATA-SVC-1 No data found for: '+tblName);
                    }
                    else {
                        this.assignMTdataOntoObjects(data, mtIdx);
                        setTimeout(()=>this.storeMTdataInLocalStorage(data, mtIdx), 50);
                        this.myLoader.dismiss();
                    } 
                    if (mtIdx+1 <= this.idxOfLastLargeMT) {
                    this.MtSubscriptionSvc.execTriggerGetStoreNextLargeMT(mtIdx+1);
                    }
                }, 
                (err) => { this.myLoader.dismiss(); 
                } );

            }
            else { //do not retrieve from server 
                this.MtSubscriptionSvc.execTriggerSetMTobjToLSOdata(mtIdx);
                if (mtIdx+1 <= this.idxOfLastLargeMT) 
                    this.MtSubscriptionSvc.execTriggerGetStoreNextLargeMT(mtIdx+1);
            }
        } );
        
         // to be executed upon creation of MasterTableDataSvc...      
         this.triggerGetStoreNextSmallMTSubscription = this.MtSubscriptionSvc.triggerGetStoreNextSmallMT 
         .subscribe(
         (mtIdx: number) =>  {
            var retrieveMtFromServer = 
                (this.missingSmallMTs.indexOf(mtIdx)>-1);
            console.log('checking retrieveMtFromServer:', 
                (this.missingSmallMTs.indexOf(mtIdx)>-1), retrieveMtFromServer, mtIdx, this.missingSmallMTs);
            const idxOfLastSmallMT = this.masterTableList.length-1;
            const url = this.httpRequestsSvc.getSiteServerUrl();
            const lsoSuffix = '-'+this.lsoRequestsSvc.syncDbName;
            const tblName = this.masterTableList[mtIdx];
            const LSOname = this.getMTlsoName(mtIdx);

            if (retrieveMtFromServer) {
                
                this.myLoader2.present('Retrieving data from '+tblName);
                this.httpRequestsSvc.handleGetRequest(url+tblName, true)
                .subscribe(
                (data) => { 
                    if (data === null) {
                        this.myLoader2.dismiss();
                        alert('REPORT THIS ERROR: MT-DATA-SVC-1 No data found for: '+tblName);
                    }
                    else {
                        this.assignMTdataOntoObjects(data, mtIdx);
                        setTimeout(()=>this.storeMTdataInLocalStorage(data, mtIdx), 50);
                        this.myLoader2.dismiss();
                    } 
                    if (mtIdx+1 <= idxOfLastSmallMT) {
                    this.MtSubscriptionSvc.execTriggerGetStoreNextSmallMT(mtIdx+1);
                    }
                }, 
                (err) => { this.myLoader2.dismiss(); 
                } );

            }
            else { //do not retrieve from server 
                this.MtSubscriptionSvc.execTriggerSetMTobjToLSOdata(mtIdx);
                if (mtIdx+1 <= idxOfLastSmallMT) 
                    this.MtSubscriptionSvc.execTriggerGetStoreNextSmallMT(mtIdx+1);
            }
         } );
          
         
        this.trigger2SetMTobjFromLSOSubscription = this.MtSubscriptionSvc.triggerSetMTobjToLSOdata 
        .subscribe(
        (mtIdx: number) =>  {      
            if (this.getNumRecsMasterTable(mtIdx) === 0) { // if not yet set initialized with LSO data
                const lsoSuffix = '-'+this.lsoRequestsSvc.syncDbName;
                const tblName = this.masterTableList[mtIdx];
                const LSOname = this.getMTlsoName(mtIdx);
                this.myLoader.present('Retrieving data from '+tblName);
                this.lsoRequestsSvc.getDataFromLocalStorage(LSOname)
                .then(
                    (data) => { 
                        //console.log(' triggerSetMTobjToLSOdata: LSO data retrieved -->', mtIdx, data);
                        if (data === null || data.length == 0 ) {
                            const arrEmptyTbls = 
                                this.applicVarsSvc.siteAccessInfo.siteConfig.emptyMasterTables;
                            let idxEmptyTbl = -2;
                            if (arrEmptyTbls.length > 0) 
                                idxEmptyTbl  = arrEmptyTbls.indexOf(tblName);
                            //console.log('^^^^ LOGIN test check for Empty Table ->', tblName, idxEmptyTbl, arrEmptyTbls);
                            
                            //if (idxEmptyTbl < 0) alert('***No data retrieved for '+tblName+' Master Table'); 
                        }
                        else {
                            this.assignMTdataOntoObjects(data, mtIdx);
                        } 
                        this.myLoader.dismiss();
                    }, 
                    (err) => { this.myLoader.dismiss() } 
                )
            }      
        } );
     }

    private triggerGetStoreNextLargeMTSubscription: Subscription;
    private triggerGetStoreNextSmallMTSubscription: Subscription;
    private trigger2SetMTobjFromLSOSubscription: Subscription;
  
    public MasterTradesData: MasterTradesModel[] = [];
    public MasterMachineStatesData: MasterMachineStatesModel[] = [];
    public MasterWoTypesData: MasterWoTypesModel[] = [];
    public MasterLocationsData: MasterLocationsModel[] = [];
    public MasterWarehousesData: MasterWarehouseModel[] = [];
    public MasterMeasureUnitsData: MasterMeasureUnitsModel[] = [];
    public MasterCauseCodesData: MasterCauseCodesModel[] = [];
    public MasterRepairCodesData: MasterRepairCodesModel[] = [];
    public MasterSymptomCodesData: MasterSymptomCodesModel[] = [];
    public MasterSuppliersData: MasterSupplierModel[] = [];
    public MasterDepartmentsData: MasterDepartmentModel[] = [];
    private MasterWoSecurityData: MasterWoSecurityModel[] = [];
    public MasterWorkReqTypesData: MasterWorkRequestTypeModel[] = [];

    public MasterTablesLog: any = [];   // [{TableName: string, LastUploaded: string}]

    private MasterCatalogData: MasterCatalogModel[] = [];
    private CatalogSearchData: CatalogSearchModel[] = [];
    private MasterCatalogAltBarcodes: CatalogAltBarcodeModel[] = [];
    private MasterStockBinsData: MasterStockBinLocModel[] = [];
    private MasterEmployeeData: MasterEmployeeModel[] = [];
    private EmployeeSearchData: EmployeeSearchModel[] = [];
    private MasterEquipmentData: MasterEquipmentModel[] = [];
    private topLevelHierarchy: MasterEquipmentModel[] = [];
    private blankCatalogInfo = new MasterCatalogModel('','','','',false,'','','','','','','',0,'');

    //genericDropdownEl: genericDropdownElModel = {elId: "", elDesc: ""};
    //private tradesDropdownList: genericDropdownElModel[] = [];
    
    public masterTableList = ['Catalog', 'Employee', 'Equipment', 'SkuWarehouseBins', 
    'Supplier', 'Locations', 'Trades', 'Warehouses', 'MachineStates', 
    'MeasureUnits', 'CauseCodes', 'RepairCodes', 'SymptomCodes', 'WoTypes', 
    'WorkRequestTypes', 'Departments', 'WoSecurity' ];

private idxOfLastLargeMT = 4;

private loadLargeMtCmd = '';
private missingLargeMTs: Array<number> = [];
private loadSmallMtCmd = '';
private missingSmallMTs: Array<number> = [];
public woSecEditWoTypes: Array<string> = [];
public woSecCreateWoTypes: Array<string> = [];


clearMTsFromLSO(): number {
    const numMTs =  this.masterTableList.length;
    for (let mtIdx = 0; mtIdx < numMTs; mtIdx++) {
        const LSOname = this.masterTableList[mtIdx]+'-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        this.lsoRequestsSvc.removeLSObject(LSOname);
    }
    return numMTs;
}
getTopEquipHierarchy() { // this is called in ngInit of selEquipment page
    //console.log('this.topLevelHierarchy ', this.topLevelHierarchy.length ,this.topLevelHierarchy );
    //console.log('this.MasterEquipmentData ', this.MasterEquipmentData.length ,this.MasterEquipmentData );
    if (this.topLevelHierarchy.length == 0) {
        for (let equip of this.MasterEquipmentData) {
            if (equip.Level == 0) {
                this.topLevelHierarchy.push(equip);
            }
        } 
    }
    //console.log('this.topLevelHierarchy ', this.topLevelHierarchy.length ,this.topLevelHierarchy );
    return this.topLevelHierarchy;
}

getChildrenOfEquip(parentId: number) {
   var children: MasterEquipmentModel[] = [];
   ////console.log('in getChildrenOfEquip, parentId ==', parentId, this.MasterEquipmentData);

   for (let equip of this.MasterEquipmentData) {
       ////console.log('>> Chk for Children -->', equip.ParentId,parentId);
       if (equip.ParentId == parentId) {
           children.push(equip);
       }
       ////console.log('CHILDREN ==>',children);
   }
   return children;
}

getMasterEquipment(): MasterEquipmentModel[] {
    // //console.log('MASTER Equipment DATA -->', this.MasterEquipmentData)
    return this.MasterEquipmentData;
}     
getEquipDesc(equipNum: string, short?: boolean): string {
    let retVal = '* not found *';
    const targetStr = equipNum.toUpperCase();
    const lastIdx = this.MasterEquipmentData.length-1;
    for (let i=0; i <= lastIdx; i++) {
        //console.log(targetStr, i, this.MasterEquipmentData[i].EquipNum.toUpperCase());
        if ( targetStr == this.MasterEquipmentData[i].EquipNum.toUpperCase() ) {
            retVal = this.MasterEquipmentData[i].Description; break;
        }
    }
    return retVal;

}
loadMasterEquipment() {
    const LSOname = 'Equipment-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    ////console.log('loadEQUIPMENT LSOname ==>', LSOname);
    if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
        this.lsoRequestsSvc.getDataFromLocalStorage(LSOname)
            .then ((data)=> this.MasterEquipmentData = data)
    } else {
        //if (this.httpRequestsSvc.connected2Server) { alert('Equipment NOT stored locally'); }
        this.MasterEquipmentData = this.genericStoreData(LSOname);
    }    
}     

loadSearchCatalogArray(skuCode, skuDesc, skuClass, skuSubClass, skuCat ): CatalogSearchModel[] {
    this.CatalogSearchData.length = 0; // ensure the array is empty
    const maxIdx = this.MasterCatalogData.length - 1;
    //console.log('loadSearchCatalogArray: ', this.MasterCatalogData);
    let numResults = 0;
    const searchSkuCode = (skuCode !== '');
    const searchSkuDesc = (skuDesc !== '');
    const searchSkuClass = (skuClass !== '');

    //console.log('loadSearchCatalogArray: ',skuCode, skuDesc, skuClass,searchSkuCode, searchSkuDesc, searchSkuClass);

    for (let i = 0; i <= maxIdx; i++) {
        let idx1 = this.MasterCatalogData[i].SkuCode.toUpperCase().indexOf(skuCode.toUpperCase());
        let idx2 = this.MasterCatalogData[i].ItemDesc.toUpperCase().indexOf(skuDesc.toUpperCase());
        let idx3 = this.MasterCatalogData[i].ItemClass.toUpperCase().indexOf(skuClass.toUpperCase());
        //console.log(this.MasterCatalogData[i].SkuCode, this.MasterCatalogData[i].ItemClass)
        
        if ( (!searchSkuCode || (idx1 > -1)) &&
            (!searchSkuDesc || (idx2 > -1)) &&
            (!searchSkuClass || (idx3 > -1)) ) {
            numResults++;
            this.CatalogSearchData.push(new CatalogSearchModel(
                    this.MasterCatalogData[i].SkuCode,
                    this.MasterCatalogData[i].ItemClass,
                    this.MasterCatalogData[i].ItemSubClass,
                    this.MasterCatalogData[i].ItemDesc,
                    this.MasterCatalogData[i].SkuCategory,
                    this.MasterCatalogData[i].CatId) );
        }
        if (numResults > 100) {return this.CatalogSearchData;}
    }
    return this.CatalogSearchData;
}

getMasterCatalog(): MasterCatalogModel[] {
    ////console.log('MASTER Catalog DATA -->', this.MasterCatalogData)
    return this.MasterCatalogData;
}      
loadMasterCatalog() {
    const LSOname = 'Catalog-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
        this.MasterCatalogData = this.getDataFromLocalStorage(LSOname);
    } else {
        this.MasterCatalogData = this.genericStoreData(LSOname);
    }         
}  

findSkuInCatalog(skuCode: string): number {
    const targetSkuCode = skuCode.toUpperCase();
    const maxIdx = this.MasterCatalogData.length - 1;
    ////console.log('maxIdx -->', maxIdx, this.MasterCatalogData);
    for (let i = 0; i <= maxIdx; i++) {
        ////console.log('..looking in Catalog for SkuCode: ', targetSkuCode,this.MasterCatalogData[i].SkuCode.toUpperCase());
        if (this.MasterCatalogData[i].SkuCode.toUpperCase() === targetSkuCode) {
            return i;
        }
    }
    return -1;
}
getSkuDesc(skuCode: string): string {
    const idx = this.findSkuInCatalog(skuCode);
    if (idx == -1) return '** not found **'
    else return this.MasterCatalogData[idx].ItemDesc;
}

getCatalogInfo4Sku(skuCode: string): MasterCatalogModel {
    const catIdx = this.findSkuInCatalog(skuCode);
    if (catIdx > -1) return this.MasterCatalogData[catIdx];
    else return this.blankCatalogInfo;
}

loadMasterWarehouseBins() {
    const LSOname = 'SkuWarehouseBins-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
        this.MasterStockBinsData = this.getDataFromLocalStorage(LSOname);
    } else {
        //if (this.httpRequestsSvc.connected2Server) { alert('Catalog NOT stored locally'); }
        this.MasterStockBinsData = this.genericStoreData(LSOname);
    }         
}    

getMasterWarehouseBins(): MasterStockBinLocModel[] {
    ////console.log('MASTER Catalog DATA -->', this.MasterCatalogData)
    return this.MasterStockBinsData; 
}   
    
getListOfBins() {
    const rtnArr: Array<string> = [];
    rtnArr.push('');
    for ( var bin of this.MasterStockBinsData ) {
        if (rtnArr.indexOf(bin.BinNum)==-1) {
            //console.log('check binNum not Already in rtnArr: ',bin.BinNum, rtnArr.indexOf(bin.BinNum) );
            rtnArr.push(bin.BinNum);            
        }
    }
    //console.log('getBinNumsBegWith', this.MasterStockBinsData, startToken, targetWhs, rtnArr );
    return rtnArr;

}

getBinNums4WhseSkuCode(targetWhs: string, targetSku: string): string[] {
    //console.log('>>getBinNums4WhseSkuCode ', targetWhs, targetSku, this.MasterStockBinsData);
    var rtnArr = [];
    for ( var bin of this.MasterStockBinsData ) {
        //console.log(bin.Warehouse, (bin.Warehouse == targetWhs), bin.SkuCode, (bin.SkuCode == targetSku ) );
        if ( ( targetWhs == '' || bin.Warehouse == targetWhs ) && bin.SkuCode == targetSku ) 
            if (rtnArr.indexOf(bin.BinNum)==-1) { // do not add a duplicate
                //console.log('check binNum not Already in rtnArr: ',bin.BinNum, rtnArr.indexOf(bin.BinNum) );
                rtnArr.push(bin.BinNum);            
            }
    }
    ////console.log('getBinNumsBegWith', this.MasterStockBinsData, startToken, targetWhs, rtnArr );
    return rtnArr;

}
getBinNumsBegWith(startToken: string, targetWhs: string): string[] {
    // Skucode, Warehouse, BinNum,
    //console.log('>>getBinNumsBegWith ', startToken, startToken.length, this.MasterStockBinsData);
    var rtnArr = [];
    rtnArr.push('');
    for ( var bin of this.MasterStockBinsData ) {
        if ( (startToken.length == 0) ||
        ( (bin.Warehouse.indexOf(targetWhs)==0) &&
        (bin.BinNum.indexOf(startToken)==0) ) ) 
            if (rtnArr.indexOf(bin.BinNum)==-1) { // do not add a duplicate
            ////console.log('check binNum not Already in rtnArr: ',bin.BinNum, rtnArr.indexOf(bin.BinNum) );
                rtnArr.push(bin.BinNum);            
            }
    }
    ////console.log('getBinNumsBegWith', this.MasterStockBinsData, startToken, targetWhs, rtnArr );
    return rtnArr;
}

getSkuWarehouseBin(skuCode: string): MasterStockBinLocModel {
    const blankSkuWareHouseBin = new MasterStockBinLocModel('','','', 0, 0, false);
    for ( var item of this.MasterStockBinsData ) {
        ////console.log('looking for SkuCode Whs/Bin --> ',skuCode, ",", item.SkuCode  );
        if (item.SkuCode == skuCode)  return item;
    }   
    // else            
    return blankSkuWareHouseBin;
}

validSkuWarehouseBin(Sku: string, Whs: string, Bin: string): boolean {
    // 1st, check if Whs is valid
    for ( var item of this.MasterStockBinsData ) {
        //console.log('validate Sku Whs Bin( ==>', Sku, Whs, Bin, item.SkuCode, item.Warehouse, item.BinNum);
        if ( (item.SkuCode == Sku) &&  (item.Warehouse == Whs) &&
        (item.BinNum == Bin) ) return true;
    }   
    // else            
    return false;
}


validWarehouseBin(Whs: string, Bin: string): boolean {
    // 1st, check if Whs is valid
    var found = false;
    //console.log('found W-Bin(1) ==>', Whs, Bin, found, this.MasterWarehousesData );
    for ( var W of this.MasterWarehousesData ) {
        if (W.Warehouse == Whs) {found = true; break;}
    }
    if (found) {
        found = false;
        for ( var bin of this.MasterStockBinsData ) {
            //console.log('found W-Bin (2)==>', Whs, Bin, bin.BinNum, found);
            if ( (bin.Warehouse == Whs) &&
            (bin.BinNum == Bin) ) {
                if (W.Warehouse == Whs) {found = true; break;}
            }
        }   
        //console.log('found W-Bin ==>', Whs, Bin, bin.BinNum, found);
    }
    return found;
}

getMasterEmployee(): MasterEmployeeModel[] {
    console.log('MASTER Employee DATA -->', this.MasterEmployeeData)
    return this.MasterEmployeeData;
}     
loadMasterEmployee() {
    const LSOname = 'Employee-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
        this.MasterEmployeeData = this.getDataFromLocalStorage(LSOname);
    } else {
        this.MasterEmployeeData = this.genericStoreData(LSOname);
    }         
}  
getEmpName(Id: string): string {
     //const numEls = this.MasterEmployeeData.length;
     for (var i in this.MasterEmployeeData) {
        const srcVal = Id.toUpperCase();
        const trgVal = this.MasterEmployeeData[i].EmpNumber.toUpperCase();
        if ( trgVal > srcVal ) break;
        if ( srcVal === trgVal ) {
            return this.MasterEmployeeData[i].EmpName;
        }
      }
    ////console.log('EMPLOYEE target id = ', Id, 'rtnVal = ', rtnVal);
    return '';
}    
getEmpTrade(Id: string): number {
     //const numEls = this.MasterEmployeeData.length;
     console.log('getEmpTrade ==> ', this.MasterEmployeeData);
     for (var i in this.MasterEmployeeData) {
        const srcVal = Id.toUpperCase();
        const trgVal = this.MasterEmployeeData[i].EmpNumber.toUpperCase();
        if ( trgVal > srcVal ) break;
        if ( srcVal === trgVal ) {
            return this.MasterEmployeeData[i].TradeId;
        }
      }
    ////console.log('EMPLOYEE target id = ', Id, 'rtnVal = ', rtnVal);
    return 0;
}    
loadSearchEmployeeArray(empNum, empName ): EmployeeSearchModel[] {
    const searchNumUpper = empNum.toUpperCase();
    const searchNameUpper = empName.toUpperCase();
    this.EmployeeSearchData.length = 0; // ensure the array is empty
    let maxIdx = this.MasterEmployeeData.length - 1;
    let numResults = 0;
    const searchEmpNum = (empNum !== '');
    const searchEmpName = (empName !== '');

    //console.log('loadSearchEmployeeArray: ',empNum, empName);

    for (let i = 0; i <= maxIdx; i++) {
        const empNumUpper = this.MasterEmployeeData[i].EmpNumber.toUpperCase();
        const empNameUpper = this.MasterEmployeeData[i].EmpName.toUpperCase();

        let idx1 = empNumUpper.indexOf(searchNumUpper);
        let idx2 = empNameUpper.indexOf(searchNameUpper);
        //console.log(this.MasterEmployeeData[i].EmpNumber, this.MasterEmployeeData[i].EmpName)
        
        if ( (!searchNumUpper || (idx1 > -1)) &&
            (!searchNameUpper || (idx2 > -1)) ) {
            numResults++;
            this.EmployeeSearchData.push(new EmployeeSearchModel(
                    this.MasterEmployeeData[i].EmpNumber,
                    this.MasterEmployeeData[i].EmpName,
                    this.MasterEmployeeData[i].EmpId) );
        }
        if (numResults > 100) {return this.EmployeeSearchData;}
    }
    return this.EmployeeSearchData;
} 

genericStoreData(LSOname: string): any {        
let apiName = LSOname; // default
    const idxDash = LSOname.indexOf('-'); // find where "-" separator char is and peel off first part
if (idxDash > -1) {
  apiName = LSOname.substring(0, idxDash);
    };    
    let dataArray = [];
    const uploadMsg = 'Uploading '+apiName+' ('+LSOname+') ...';
    //console.log(uploadMsg);
   
    if ( this.httpRequestsSvc.connected2Server ) { // BEGIN deviceIsOnline        
      const liveurl = this.applicVarsSvc.getApiRootUrl() + apiName;       
      this.http.get(liveurl, { headers: this.httpRequestsSvc.createHttpHeader(true) })
        .toPromise()
        .then (
          (value) => {                
            for ( let item in value ) {
              dataArray.push(value[item]);
            }
            this.lsoRequestsSvc.storeDataInLocalStorage(dataArray, LSOname);
            // now update the Master Tables Log ...
            const dateTimeNow = new Date();                
            const foundIdx = this.MasterTablesLog.findIndex( el => el.TableName == LSOname);
            
            ////console.log('masterTableList LOG 1 ==>', this.MasterTablesLog, apiName, foundIdx, dateTimeNow);
            if (foundIdx > -1) { // remove existing item
                this.MasterTablesLog.splice(foundIdx, 1);
            }                
            this.MasterTablesLog.push( {TableName: LSOname, LastUploaded: dateTimeNow.toString()});
            this.lsoRequestsSvc.storeDataInLocalStorage(this.MasterTablesLog, 
                 'MasterTablesLog-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName);
            ////console.log('masterTableList LOG 2 ==>', dataArray, apiName, foundIdx, dateTimeNow);

            this.lsoRequestsSvc.addLocalStorageTableName(LSOname);
          },
          msg => {
            //console.log('Unable to Retrieve '+apiName+' from Server');
            //call function to reterive data from device storage		
            dataArray = this.getDataFromLocalStorage(LSOname);
          }
        )
      } // END deviceIsOnline
      else {
        dataArray = this.getDataFromLocalStorage(LSOname);
      }
        return dataArray;	 
    }     

    getMasterTrades(): MasterTradesModel[] {
        return this.MasterTradesData;
     } 
    loadMasterTrades() { 
        const LSOname = 'Trades-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;  
                 
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterTradesData = this.getDataFromLocalStorage(LSOname);
            console.log('*!*!*!*! loadMasterTrades(), LSOname=', LSOname,  this.MasterTradesData ) ;
        } else {
            this.MasterTradesData = this.genericStoreData(LSOname);
        }         
    }    

    getTradeCodes(): Array<string> {
        let rtnCodes: Array<string> = [];
        for (let item of this.MasterTradesData) {
            rtnCodes.push(item.TradeDesc);
        }
        return rtnCodes;
    }     

    getTradeId(descStr: string): number {
        const maxIndex = this.MasterTradesData.length - 1;
        for (let i = 0; i <= maxIndex; i++) {
            //console.log('getTradeID: descStr= ['+descStr+']', this.MasterTradesData[i].TradeDesc );
          if (this.MasterTradesData[i].TradeDesc == descStr) return this.MasterTradesData[i].TradeId; 
        }
        return -1;
      }
    getTradeDesc(Id: number): string {
        let rtnVal = '';
         const numEls = this.MasterTradesData.length;
         for (var i in this.MasterTradesData) {
            ////console.log('LOOP: getTradeDesc', this.MasterTradesData[i].TradeId, this.MasterTradesData[i].TradeDesc);
            if (this.MasterTradesData[i].TradeId === Id) {
                return this.MasterTradesData[i].TradeDesc;
            }
          }
        //console.log('target id = ', Id, 'rtnVal = ', rtnVal);
        return rtnVal;
    }

    getMasterMachineStates(): MasterMachineStatesModel[] {
        return this.MasterMachineStatesData;
    }
    
    getMachineStateCodes(): Array<string> {
        let rtnCodes: Array<string> = [];

        for (let item of this.MasterMachineStatesData) {
            rtnCodes.push(item.MachineStateDesc);
        }
        //console.log('#### getMachineStateCodes (3)->', rtnCodes);
        return rtnCodes;
    }     
     
    loadMasterMachineStates() {    
        const LSOname = 'MachineStates-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;     
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterMachineStatesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterMachineStatesData = this.genericStoreData(LSOname);
        }         
    } 
    getMachStateId(descStr: string): number {
      let maxIndex = this.MasterMachineStatesData.length - 1;
      for (let i = 0; i <= maxIndex; i++) {
        if (this.MasterMachineStatesData[i].MachineStateDesc == descStr)
            return this.MasterMachineStatesData[i].MachineStateId; 
      }
      return 0;
    }
    
    getMachineStateDesc(Id: number): string {
         //const numEls = this.MasterMachineStatesData.length;
         for (var i in this.MasterMachineStatesData) {
            //console.log('LOOP: getMachineStateDesc', this.MasterMachineStatesData[i].MachineStateId, this.MasterMachineStatesData[i].MachineStateDesc);
            if (this.MasterMachineStatesData[i].MachineStateId === Id) {
                return this.MasterMachineStatesData[i].MachineStateDesc;
            }
          }
        return '';
    }
    
    getMasterWoTypes(): MasterWoTypesModel[] {
        return this.MasterWoTypesData;
     }     
    loadMasterWoTypes() {  
        const LSOname = 'WoTypes-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        //this.MasterWoTypesData = [{"WoTypeId":1,"WoTypeCode":"PM","WoTypeDesc":"PM Work Orders"},{"WoTypeId":2,"WoTypeCode":"GN","WoTypeDesc":"General Work Orders"},{"WoTypeId":3,"WoTypeCode":"BD","WoTypeDesc":"Breakdown Work Orders"},{"WoTypeId":4,"WoTypeCode":"CP","WoTypeDesc":"Capital Work Orders"},{"WoTypeId":5,"WoTypeCode":"QA","WoTypeDesc":"Quality"},{"WoTypeId":6,"WoTypeCode":"SF","WoTypeDesc":"Safety"},{"WoTypeId":7,"WoTypeCode":"PF","WoTypeDesc":"Process Flow"},{"WoTypeId":8,"WoTypeCode":"ST","WoTypeDesc":"Startup Work Order"},{"WoTypeId":9,"WoTypeCode":"SD","WoTypeDesc":"Shutdown Work Order"},{"WoTypeId":10,"WoTypeCode":"CD","WoTypeDesc":"Cleandown Work Order"}];
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterWoTypesData = this.genericStoreData(LSOname);
            this.MasterWoTypesData = this.getDataFromLocalStorage(LSOname);
        } else {
        }   
          
    }    
    getWoTypeCodes(isEdit: boolean): Array<string> {
        let rtnCodes: Array<string> = [];
        for (let item of this.MasterWoTypesData) {
            if (isEdit) {
                if (this.woSecEditWoTypes.indexOf(item.WoTypeCode)>=0 )
                    rtnCodes.push(item.WoTypeDesc);
            }
            else {
                if (this.woSecCreateWoTypes.indexOf(item.WoTypeCode)>=0 )
                    rtnCodes.push(item.WoTypeDesc);
            }
        }
        //console.log('#### getWoTypeCodes ->', this.MasterWoTypesData, rtnCodes);
        return rtnCodes;
    }     
    getWoTypeDesc(Id: number): string {
        var rtnVal = '';
         //const numEls = this.MasterWoTypesData.length;
         for (var i in this.MasterWoTypesData) {
            //console.log('LOOP: getWoTypeDesc target ==>', Id, ', Source -->', this.MasterWoTypesData[i].WoTypeId);
            if (this.MasterWoTypesData[i].WoTypeId === Id) {
                rtnVal = this.MasterWoTypesData[i].WoTypeDesc;
                //console.log('Wo Type FOUND ** target id = ', Id, 'rtnVal = ', rtnVal);
                return rtnVal;
            }
          }
        return rtnVal;
    }   
    getWoTypeId(descStr: string): number {
        var rtnVal = 0;
         //const numEls = this.MasterWoTypesData.length;
         for (var i in this.MasterWoTypesData) {
            console.log('LOOP: getWoTypeDesc target ==>', descStr, ', Source -->', this.MasterWoTypesData[i].WoTypeDesc);
            if (this.MasterWoTypesData[i].WoTypeDesc === descStr) {
                rtnVal = this.MasterWoTypesData[i].WoTypeId;
                ////console.log('Wo Type FOUND ** target id = ', Id, 'rtnVal = ', rtnVal);
                return rtnVal;
            }
          }
        //console.log('Wo Type target id = ', Code, 'rtnVal = ', rtnVal);
        return rtnVal;
    }   
    
    getMasterLocations(): MasterLocationsModel[] {
        return this.MasterLocationsData;
     }     
    loadMasterLocations() {  
        const LSOname = 'Locations-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;   
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterLocationsData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterLocationsData = this.genericStoreData(LSOname);
        }         
    }    
    getLocationName(Id: number) {
        const idx = this.MasterLocationsData.findIndex((data)=> data.LocationId === Id);
        if (idx >= 0) return this.MasterLocationsData[idx].Name;
        else return '';
    }
    
    getMasterWarehouses(): MasterWarehouseModel[] {
        return this.MasterWarehousesData;
     }     
    loadMasterWarehouses() {    
        const LSOname = 'Warehouses-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName; 
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterWarehousesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterWarehousesData = this.genericStoreData(LSOname);
        }         
    }    
    
    getMasterMeasureUnits(): MasterMeasureUnitsModel[] {
        return this.MasterMeasureUnitsData;
     }     
    loadMasterMeasureUnits() {
        const LSOname = 'MeasureUnits-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterMeasureUnitsData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterMeasureUnitsData = this.genericStoreData(LSOname);
        }         
    }            
    
    getCauseCodeText(codeVal: string): string {
        for (var i in this.MasterCauseCodesData) {
           //console.log('LOOP: getSupplierName', this.MasterSuppliersData[i].SupplierCode, this.MasterSuppliersData[i].SupplierName);
           if (this.MasterCauseCodesData[i].CauseCode === codeVal) {
               return this.MasterCauseCodesData[i].CauseLongDesc;
           }
        }
    }
    getMasterCauseCodes(): MasterCauseCodesModel[] {
        return this.MasterCauseCodesData;
     }     
    loadMasterCauseCodes() {
        const LSOname = 'CauseCodes-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterCauseCodesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterCauseCodesData = this.genericStoreData(LSOname);
        }         
    }            
    
    getRepairCodeText(codeVal: string): string {
        //console.log('**REMOVE - getRepairCodeText =>', codeVal, this.MasterRepairCodesData);
        for (var i in this.MasterRepairCodesData) {
           if (this.MasterRepairCodesData[i].RepairCode === codeVal) {
               return this.MasterRepairCodesData[i].RepairLongDesc;
           }
        }
    }
    getMasterRepairCodes(): MasterRepairCodesModel[] {
        return this.MasterRepairCodesData;
     }     
    loadMasterRepairCodes() {
        const LSOname = 'RepairCodes-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterRepairCodesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterRepairCodesData = this.genericStoreData(LSOname);
        }         
    } 
            
    getSymptomCodeText(codeVal: string): string {
        for (var i in this.MasterSymptomCodesData) {
           //console.log('LOOP: getSupplierName', this.MasterSuppliersData[i].SupplierCode, this.MasterSuppliersData[i].SupplierName);
           if (this.MasterSymptomCodesData[i].SymptomCode === codeVal) {
               return this.MasterSymptomCodesData[i].SymptomLongDesc;
           }
        }
    }
    getMasterSymptomCodes(): MasterSymptomCodesModel[] {
        return this.MasterSymptomCodesData;
     }     
    loadMasterSymptomCodes() {
        const LSOname = 'SymptomCodes-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterSymptomCodesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterSymptomCodesData = this.genericStoreData(LSOname);
        }         
    }  
    
   //public MasterDepartmentsData: DepartmentModel[] = [];
    getMasterDepartments(): MasterDepartmentModel[] {
        return this.MasterDepartmentsData;
     }     
    loadMasterDepartments() {  
        const LSOname = 'Departments-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        //this.MasterWoTypesData = [{"WoTypeId":1,"WoTypeCode":"PM","WoTypeDesc":"PM Work Orders"},{"WoTypeId":2,"WoTypeCode":"GN","WoTypeDesc":"General Work Orders"},{"WoTypeId":3,"WoTypeCode":"BD","WoTypeDesc":"Breakdown Work Orders"},{"WoTypeId":4,"WoTypeCode":"CP","WoTypeDesc":"Capital Work Orders"},{"WoTypeId":5,"WoTypeCode":"QA","WoTypeDesc":"Quality"},{"WoTypeId":6,"WoTypeCode":"SF","WoTypeDesc":"Safety"},{"WoTypeId":7,"WoTypeCode":"PF","WoTypeDesc":"Process Flow"},{"WoTypeId":8,"WoTypeCode":"ST","WoTypeDesc":"Startup Work Order"},{"WoTypeId":9,"WoTypeCode":"SD","WoTypeDesc":"Shutdown Work Order"},{"WoTypeId":10,"WoTypeCode":"CD","WoTypeDesc":"Cleandown Work Order"}];
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterDepartmentsData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterDepartmentsData = this.genericStoreData(LSOname);
        }             
    }       
    getDepartmentName(Id: number): string {
        const idx = this.MasterDepartmentsData.findIndex((data)=> data.DeptId  === Id);
        if (idx >= 0) return this.MasterDepartmentsData[idx].DeptName ;
        else return '';
    }
          
   //public MasterWoSecurityData: MasterWoSecurityModel[] = [];
    getMasterWoSecurity(): MasterWoSecurityModel[] {
        return this.MasterWoSecurityData;
     }     
    loadMasterWoSecurity() {  
        console.log('--REMOVE loadMasterWoSecurity called');
        const LSOname = 'WoSecurity-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        
        //this.MasterWoSecurityData = this.getWoSecurity(); // TEMPORARY ** REMOVE ONCE API CALL IS FINISHED
        //console.log('**REMOVE: loadMasterWoSecurity()', this.MasterWoSecurityData);
        // NEXT LINE IS ALSO TEMPORARY ** REMOVE ONCE API CALL IS FINISHED
        //this.lsoRequestsSvc.storeDataInLocalStorage(this.MasterWoSecurityData, 'WoSecurity-TestRcSync');
        //REMOVE COMMENTS
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterWoSecurityData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterWoSecurityData = this.genericStoreData(LSOname);
        }         
    }
    getWoSecWoTypes(Id: number, newWO: boolean): Array<string> {
        const L=this.MasterWoSecurityData.length;
        var woSecType = 'WOEDIT';
        if (newWO) woSecType = 'WONEW';
        console.log('**REMOVE getWoSecWoTypes()', Id, woSecType, this.MasterWoSecurityData);
        var rtnTypes = [];
        for (let idx = 0; idx < L; idx++) {
            if (this.MasterWoSecurityData[idx].UserSecId == Id
                && this.MasterWoSecurityData[idx].PolicyName == woSecType) {
                    rtnTypes.push(this.MasterWoSecurityData[idx].WoTypeCode);
            }
        }
        return rtnTypes;
    }  
    loadWoSecArrays() {
        const userId = this.applicVarsSvc.getLoginUserId();
        this.woSecEditWoTypes = this.getWoSecWoTypes(userId, false);
        this.woSecCreateWoTypes = this.getWoSecWoTypes(userId, true);
    }
    isWoCreateAllowed(): boolean {
        return (this.woSecCreateWoTypes.length > 0);
    }  
    isWoEditAllowed(): boolean {
        console.log('**REMOVE: isWoEditAllowed()', this.woSecEditWoTypes);
        return (this.woSecEditWoTypes.length > 0);
    }  
      
    getWoSecurity(): MasterWoSecurityModel[] {
        const newArr = [{
            UserSecId: 18,
            PolicyName: 'WOEDIT',
            WoTypeCode: 'GN'},
            {
                UserSecId: 18,
                PolicyName: 'WOEDIT',
                WoTypeCode: 'BD'},
            {
                UserSecId: 18,
                PolicyName: 'WONEW',
                WoTypeCode: 'GN'}
        ];

        console.log('--REMOVE: getWoSecurity()', newArr);
        return newArr //this.MasterLocationsData; 
        
     }      

//public MasterWorkReqTypesData: WorkReqTypeModel[] = [];
    getMasterWorkRequestTypes(): MasterWorkRequestTypeModel[] {
        return this.MasterWorkReqTypesData;
     }     
    loadMasterWorkRequestTypes() {  
        const LSOname = 'WorkRequestTypes-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
        if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.MasterWorkReqTypesData = this.getDataFromLocalStorage(LSOname);
        } else {
            this.MasterWorkReqTypesData = this.genericStoreData(LSOname);
        }            
    }      
    getWorkRequestTypeDesc(Id: number): string {
        const idx = this.MasterWorkReqTypesData.findIndex((data)=> data.WorkReqTypeId  === Id);
        if (idx >= 0) return this.MasterWorkReqTypesData[idx].WorkReqTypeDesc;
        else return '';
    }    
  
     getWorkReqTypes(): MasterWorkRequestTypeModel[] {
        const newWrType = [{
            WorkReqTypeId: 1,
            WorkReqTypeDesc: 'Safety',
            DefaultFlag: true },
            { WorkReqTypeId: 2,
            WorkReqTypeDesc: 'Production',
            DefaultFlag: true },
            { WorkReqTypeId: 3,
            WorkReqTypeDesc: 'Maintenance',
            DefaultFlag: true }
        ]
        return newWrType; //this.MasterLocationsData; 
       
     }      
   
    getSupplierName(Id: string): string {
    //const numEls = this.MasterEmployeeData.length;
    for (var i in this.MasterSuppliersData) {
       //console.log('LOOP: getSupplierName', this.MasterSuppliersData[i].SupplierCode, this.MasterSuppliersData[i].SupplierName);
       if (this.MasterSuppliersData[i].SupplierCode === Id) {
           return this.MasterSuppliersData[i].SupplierName;
       }
     }

   ////console.log('EMPLOYEE target id = ', Id, 'rtnVal = ', rtnVal);
   return '';
}    
getMasterSuppliers(): MasterSupplierModel[] {
    return this.MasterSuppliersData;
    }     
loadMasterSuppliers() {
    const LSOname = 'Supplier-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
    if (this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
        this.MasterSuppliersData = this.getDataFromLocalStorage(LSOname);
    } else {
        this.MasterSuppliersData = this.genericStoreData(LSOname);
    }         
}    

deleteMasterTableRow(tblName: string, rowObj: any) {
    var tblObj: any; let idx = -1;
    switch(tblName) {
        case 'Catalog': { tblObj = this.MasterCatalogData; 
            idx = tblObj.findIndex((obj) => { return obj.SkuCode == rowObj.SkuCode});
            break; }
        case 'Employee': { tblObj = this.MasterEmployeeData; 
            idx = tblObj.findIndex((obj) => { return obj.EmpNumber == rowObj.EmpNumber});
            break; }
        case 'Equipment': { tblObj = this.MasterEquipmentData; 
            idx = tblObj.findIndex((obj) => { return obj.EquipNum == rowObj.EquipNum});
            break; }
        case 'SkuWarehouseBins': { tblObj = this.MasterStockBinsData; 
            idx = tblObj.findIndex((obj) => { return obj.EntRecUid == rowObj.EntRecUid});
            break; }
        case 'Supplier': { tblObj = this.MasterSuppliersData; 
            idx = tblObj.findIndex((obj) => { return obj.SupplierCode == rowObj.SupplierCode});
            break; }
    }

    if (debugMode) console.log('Before delete '+tblName+' ==> ', tblObj.length, idx, tblObj);
    if (idx > -1) {
      tblObj.splice(idx, 1);
      if (debugMode) console.log('After delete ==> Employees', tblObj.length);
    }
    else { if (debugMode) console.log('Nothing found to delete!!!!'); 
    }
}
insertMasterTableRow(tblName: string, rowObj: any) {
    var tblObj: any; 
    var keyName = '';
    switch(tblName) {
        case 'Catalog': { tblObj = this.MasterCatalogData; keyName = 'SkuCode'; break; }
        case 'Employee': { tblObj = this.MasterEmployeeData; keyName = 'EmpNumber'; break; }
        case 'Equipment': { tblObj = this.MasterEquipmentData; keyName = 'EquipNum'; break; }
        case 'SkuWarehouseBins': { tblObj = this.MasterStockBinsData; break; }
        case 'Supplier': { tblObj = this.MasterSuppliersData; keyName = 'SupplierCode'; break; }
    }

    if (debugMode) console.log('Begin Insert: ', tblName, rowObj, tblObj);
    const lastIdx = tblObj.length-1;
    if (tblName == 'SkuWarehouseBins') { // special case bcuz of 3 components comprising key
        var insertIdx = 0;
        // 
        if (rowObj.SkuCode >= tblObj.SkuCode && rowObj.Warehouse >= tblObj.Warehouse && 
            rowObj.BinNum >= tblObj.BinNum) { // insert at end
          tblObj.push(rowObj);
          insertIdx = tblObj.length-1;
        }
        else {
          let i = 0;
          let done = false;
          do {
            insertIdx = i++;
            done = (rowObj.SkuCode <= tblObj.SkuCode && rowObj.Warehouse <= tblObj.Warehouse && 
                rowObj.BinNum <= tblObj.BinNum);
            //console.log('Looking for spot to insert row: ', insertIdx, rowObj.BinNum,"<=",tblObj[insertIdx].BinNum,done);
          } while ( (i <= lastIdx) && (!done) ) 
          //console.log('insert row @ ', insertIdx);
          tblObj.splice(insertIdx, 0, rowObj); 
        }
    }
    else { // NOT SkuWarehouseBins table
        insertIdx = 0;
        if (rowObj[keyName] >= tblObj[lastIdx][keyName]) { // insert at end
            tblObj.push(rowObj);
            insertIdx = tblObj.length-1;
        }
        else {
            let i = 0;
            let done = false;
            do {
            insertIdx = i++;
            done = rowObj[keyName] <= tblObj[insertIdx][keyName];
            if (debugMode) console.log('Looking for spot to insert rwo: ', insertIdx, rowObj[keyName],"<=",tblObj[insertIdx][keyName],done);
            } while ( (i <= lastIdx) && (!done) ) 
            tblObj.splice(insertIdx, 0, rowObj); 
        }
    }
    if (debugMode) console.log('Completed Insert: ', insertIdx, keyName, rowObj, tblObj);
}

updateMasterTableRow(tblName: string, rowObj: any): boolean {
    var tblObj: any; let idx = -1;
    switch(tblName) {
        case 'Catalog': { tblObj = this.MasterCatalogData; 
            idx = tblObj.findIndex((obj) => { return obj.SkuCode == rowObj.SkuCode});
            break; }
        case 'Employee': { tblObj = this.MasterEmployeeData; 
            idx = tblObj.findIndex((obj) => { return obj.EmpNumber == rowObj.EmpNumber});
            break; }
        case 'Equipment': { tblObj = this.MasterEquipmentData; 
            idx = tblObj.findIndex((obj) => { return obj.EquipNum == rowObj.EquipNum});
            break; }
        case 'SkuWarehouseBins': { tblObj = this.MasterStockBinsData; 
            idx = tblObj.findIndex((obj) => { return obj.EntRecUid == rowObj.EntRecUid});
            break; }
        case 'Supplier': { tblObj = this.MasterSuppliersData; 
            idx = tblObj.findIndex((obj) => { return obj.SupplierCode == rowObj.SupplierCode});
            break; }
    }
    console.log('Process update '+tblName+' ==> ', tblObj.length, idx, tblObj);
    if (idx > -1) {
        if (debugMode) console.log('Before update ==>', idx, tblObj[idx]);
        //Copy property values to this.currMaterialLine
        for (var key in rowObj) {
            tblObj[idx][key] = rowObj[key];
    }
        if (debugMode) console.log('After update ==>', tblObj.length);
      return true; // found & updated the row
    }
    else { 
        if (debugMode) console.log('Rec NOT found to update!!!!'); 
        return false; // did not find the row
    }        
}

handleTblIncrementalUpdate(tblName) {
    // 1st --> request the actual changed rows
    if ( this.httpRequestsSvc.connected2Server ) {  
        const liveurl = this.applicVarsSvc.getApiRootUrl() + tblName +'/update';  
        this.http.get(liveurl, {
        headers: this.httpRequestsSvc.createHttpHeader(true)
        })
        .toPromise()
        .then (
            (value) => {           
                for ( let item in value ) { // for each row changed/deleted
                    //let swbTbl = (tblName == 'SkuWarehouseBins');
                    //if (swbTbl) {
                    if (value[item].RecordDeleted || (value[item].CDFlag && value[item].CDFlag == 'D') ) {
                        this.deleteMasterTableRow(tblName, value[item]);
                    }
                    else {
                        const wasUPdated = this.updateMasterTableRow(tblName, value[item]); 
                        if (debugMode) console.log('wasUPdated', wasUPdated);
                    if (!wasUPdated) this.insertMasterTableRow(tblName, value[item]);
                    }   
                    // now save the table back into Local Storage...
                    const LSOname = tblName+'-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
                    this.lsoRequestsSvc.storeDataInLocalStorage(value[item], LSOname); 
                }  // for each row changed/deleted  
            },
            msg => {
                //loader.dismiss();
                //console.log('Unable to Retrieve '+apiName+' from Server');
                //call function to reterive data from device storage		
                //dataArray = this.getDataFromLocalStorage(LSOname);
            } // msg
        ) // then
    } // device online
}

callLoadMasterTable(mtIdx: number) {
    if (debugMode) console.log('Loading MT ', this.masterTableList[mtIdx]);
    switch (mtIdx ) {
        case 0: { this.loadMasterCatalog(); break; }
        case 1: { this.loadMasterEmployee(); break; }
        case 2: { this.loadMasterEquipment(); break; }
        case 3: { this.loadMasterWarehouseBins(); break; }
        case 4: { this.loadMasterSuppliers(); break; }
        case 5: { this.loadMasterLocations(); break; }
        case 6: { this.loadMasterTrades(); break; }
        case 7: { this.loadMasterWarehouses(); break; }
        case 8: { this.loadMasterMachineStates(); break; }
        case 9: { this.loadMasterMeasureUnits(); break; }
        case 10: { this.loadMasterCauseCodes(); break; }
        case 11: { this.loadMasterRepairCodes(); break; }
        case 12: { this.loadMasterSymptomCodes(); break; }
        case 13: { this.loadMasterWoTypes(); break; }
        case 14: { this.loadMasterWorkRequestTypes(); break; }
        case 15: { this.loadMasterDepartments(); break; }
        case 16: { this.loadMasterWoSecurity(); break; }
    }
    console.log('--REMOVE: callLoadMasterTable', mtIdx, this.MasterWoSecurityData);
}

getNumRecsMasterTable(mtIdx: number): number {
    let rtnVal = 0;
    switch (mtIdx ) {
        case 0: { rtnVal = this.MasterCatalogData.length; break; }
        case 1: { rtnVal = this.MasterEmployeeData.length; break; }
        case 2: { rtnVal = this.MasterEquipmentData.length; break; }
        case 3: { rtnVal = this.MasterStockBinsData.length; break; }
        case 4: { rtnVal = this.MasterSuppliersData.length; break; }
        case 5: { rtnVal = this.MasterLocationsData.length; break; }
        case 6: { rtnVal = this.MasterTradesData.length; break; }
        case 7: { rtnVal = this.MasterWarehousesData.length; break; }
        case 8: { rtnVal = this.MasterMachineStatesData.length; break; }
        case 9: { rtnVal = this.MasterMeasureUnitsData.length; break; }
        case 10: { rtnVal = this.MasterCauseCodesData.length; break; }
        case 11: { rtnVal = this.MasterRepairCodesData.length; break; }
        case 12: { rtnVal = this.MasterSymptomCodesData.length; break; }
        case 13: { rtnVal = this.MasterWoTypesData.length; break; }
        case 14: { rtnVal = this.MasterWorkReqTypesData.length; break; }
        case 15: { rtnVal = this.MasterDepartmentsData.length; break; }
        case 16: { rtnVal = this.MasterWoSecurityData.length; break; }
    }
    return rtnVal;
}

initializeMasterTableDataObjects(mtIdx: number, LSOname: string){
    switch (mtIdx ) {
        case 0: { if (this.MasterCatalogData.length == 0) this.MasterCatalogData = this.getDataFromLocalStorage(LSOname); break; }
        case 1: { if (this.MasterEmployeeData.length == 0) this.MasterEmployeeData = this.getDataFromLocalStorage(LSOname); break; }
        case 2: { if (this.MasterEquipmentData.length == 0) this.MasterEquipmentData = this.getDataFromLocalStorage(LSOname); break; }
        case 3: { if (this.MasterStockBinsData.length == 0) this.MasterStockBinsData = this.getDataFromLocalStorage(LSOname); break; }
        case 4: { if (this.MasterSuppliersData.length == 0) this.MasterSuppliersData = this.getDataFromLocalStorage(LSOname); break; }
        case 5: { if (this.MasterLocationsData.length == 0) this.MasterLocationsData = this.getDataFromLocalStorage(LSOname); break; }
        case 6: { if (this.MasterTradesData.length == 0) this.MasterTradesData = this.getDataFromLocalStorage(LSOname); break; }
        case 7: { if (this.MasterWarehousesData.length == 0) this.MasterWarehousesData = this.getDataFromLocalStorage(LSOname); break; }
        case 8: { if (this.MasterMachineStatesData.length == 0) this.MasterMachineStatesData = this.getDataFromLocalStorage(LSOname); break; }
        case 9: { if (this.MasterMeasureUnitsData.length == 0) this.MasterMeasureUnitsData = this.getDataFromLocalStorage(LSOname); break; }
        case 10: { if (this.MasterCauseCodesData.length == 0) this.MasterCauseCodesData = this.getDataFromLocalStorage(LSOname); break; }
        case 11: { if (this.MasterRepairCodesData.length == 0) this.MasterRepairCodesData = this.getDataFromLocalStorage(LSOname); break; }
        case 12: { if (this.MasterSymptomCodesData.length == 0) this.MasterSymptomCodesData = this.getDataFromLocalStorage(LSOname); break; }
        case 13: { if (this.MasterWoTypesData.length == 0) this.MasterWoTypesData = this.getDataFromLocalStorage(LSOname); break; }
        case 14: { if (this.MasterWorkReqTypesData.length == 0) this.MasterWorkReqTypesData = this.getDataFromLocalStorage(LSOname); break; }
        case 15: { if (this.MasterDepartmentsData.length == 0) this.MasterDepartmentsData = this.getDataFromLocalStorage(LSOname); break; }
        case 16: { if (this.MasterWoSecurityData.length == 0) this.MasterWoSecurityData = this.getDataFromLocalStorage(LSOname); break; }
        case 17: { if (this.MasterCatalogAltBarcodes.length == 0) this.MasterCatalogAltBarcodes = this.getDataFromLocalStorage(LSOname); break; }
    }
}

check4MasterTableUpdates(onlyLargeTables: boolean) {
    if (debugMode) console.log('check4MasterTableUpdates');
    if ( this.httpRequestsSvc.connected2Server ) {  
        const liveurl = this.applicVarsSvc.getApiRootUrl() + 'ListChangedTables';   
        this.http.get(liveurl, { headers: this.httpRequestsSvc.createHttpHeader(true) })
        .toPromise()
        .then (
            (value) => {   
                var listOfChgdTblObjs = []; 
                var listOfChgdTblNames = [];            
                for ( let item in value ) {
                    listOfChgdTblObjs.push(value[item]);
                    listOfChgdTblNames.push(value[item].TableName);
                }
                if (debugMode) 
                    console.log('List of Changed Tables ...', listOfChgdTblObjs,' List of MTs ==> ', this.masterTableList);
                let lastIdx = this.masterTableList.length-1;
                if (onlyLargeTables) lastIdx = this.idxOfLastLargeMT;
                for ( let tblIdx = 0; tblIdx <= lastIdx; tblIdx++ ) { // for each of the Master Tables...
                    let tblName = this.masterTableList[tblIdx];
                    // FIRST ... check if table is in Local Storage
                    const LSOname = tblName+'-'+this.applicVarsSvc.siteAccessInfo.siteSyncDbName;
                    if ( !this.lsoRequestsSvc.isTableInLocalStorage(LSOname) ) { // table is NOT in Local Storage
                        if (debugMode) 
                            console.log('--> table is NOT in Local Storage: ', LSOname);
                        this.callLoadMasterTable(tblIdx); 
                    }
                    else { // the table IS in Local Storage
                        // ensure that local obj has been initialized
                        this.initializeMasterTableDataObjects(tblIdx, LSOname);
                        setTimeout(()=> { 
                            const x = listOfChgdTblNames.findIndex(tb => tb === tblName);
                            if ( x > -1 ) { // found this MT on the list of Changed Tables
                                if (debugMode) 
                                    console.log(tblName+' Table IS in Local Storage and has been changed', tblName, tblIdx, x ); 
                                const largeMT = ( x <= this.idxOfLastLargeMT );
                                let uploadEntireTbl = false;
                                if ( largeMT ) { // upload entire table if either total rows in table < 100 or number changes > 20%
                                    const numRecs = this.getNumRecsMasterTable(tblIdx);
                                    if ( numRecs <= 50 ) uploadEntireTbl = true
                                    else{
                                        const pctChgd = listOfChgdTblObjs[x].NumRows/numRecs;
                                        uploadEntireTbl = (  pctChgd > .20 );
                                        if (debugMode) 
                                            console.log('pctChgd =>', pctChgd, uploadEntireTbl);
                                    }
                                    if (debugMode) 
                                        console.log('  changed MT '+tblName, listOfChgdTblObjs[x].NumRows, numRecs, uploadEntireTbl);
                                }
                                // uploadEntireTbl = false; // **TESTING ONLY** REMOVE THIS LINE 
                                if (debugMode) 
                                    console.log('largeMT =>', largeMT, ', uploadEntireTbl =>', uploadEntireTbl);
                                if ( largeMT && !uploadEntireTbl) { // this is a LARGE Master Table --> then do incremental update
                                    if (debugMode) console.log('Incremental update for Large MT');
                                    this.handleTblIncrementalUpdate(tblName);
                                }
                                else { // just re-upload the whole file
                                    if (debugMode) console.log('upload the whole table');
                                    this.callLoadMasterTable(tblIdx);     
                                }
                            }
                        //console.log('ionViewDidEnter-3');
                        },100);
                    }
                }                   
            },
            msg => {
                //loader.dismiss();
                //console.log('Unable to Retrieve '+apiName+' from Server');
                //call function to reterive data from device storage		
                //dataArray = this.getDataFromLocalStorage(LSOname);
            }
        )
    }
}

storeMTdataInLocalStorage(data: any, mtIdx: number) {
    let LSOname = this.getMTlsoName(mtIdx);
    this.lsoRequestsSvc.addLocalStorageTableName(LSOname);
    this.lsoRequestsSvc.storeDataInLocalStorage(data, LSOname);
}

assignMTdataOntoObjects(data: any, mtIdx: number) {
    //if (debugMode) console.log('assignMTdataOntoObjects ', mtIdx, this.masterTableList[mtIdx],data);
    switch (mtIdx ) {
        case 0: { this.MasterCatalogData.length = 0; break; }
        case 1: { this.MasterEmployeeData.length = 0; break; }
        case 2: { this.MasterEquipmentData.length = 0; break; }
        case 3: { this.MasterStockBinsData.length = 0; break; }
        case 4: { this.MasterSuppliersData.length = 0; break; }
        case 5: { this.MasterLocationsData.length = 0; break; }
        case 6: { this.MasterTradesData.length = 0; break; }
        case 7: { this.MasterWarehousesData.length = 0; break; }
        case 8: { this.MasterMachineStatesData.length = 0; break; }
        case 9: { this.MasterMeasureUnitsData.length = 0; break; }
        case 10: { this.MasterCauseCodesData.length = 0; break; }
        case 11: { this.MasterRepairCodesData.length = 0; break; }
        case 12: { this.MasterSymptomCodesData.length = 0; break; }
        case 13: { this.MasterWoTypesData.length = 0; break; }
        case 14: { this.MasterWorkReqTypesData.length = 0; break; }
        case 15: { this.MasterDepartmentsData.length = 0; break; }
        case 16: { this.MasterWoSecurityData.length = 0; break; }
    }
    // first, zero out the object...
    switch (mtIdx ) {
        case 0: { this.MasterCatalogData = data.slice(); break; }
        case 1: { this.MasterEmployeeData = data.slice(); break; }
        case 2: { this.MasterEquipmentData = data.slice(); break; }
        case 3: { this.MasterStockBinsData = data.slice(); break; }
        case 4: { this.MasterSuppliersData = data.slice(); break; }
        case 5: { this.MasterLocationsData = data.slice(); break; }
        case 6: { this.MasterTradesData = data.slice(); break; }
        case 7: { this.MasterWarehousesData = data.slice(); break; }
        case 8: { this.MasterMachineStatesData = data.slice(); break; }
        case 9: { this.MasterMeasureUnitsData = data.slice(); break; }
        case 10: { this.MasterCauseCodesData = data.slice(); break; }
        case 11: { this.MasterRepairCodesData = data.slice(); break; }
        case 12: { this.MasterSymptomCodesData = data.slice(); break; }
        case 13: { this.MasterWoTypesData = data.slice(); break; }
        case 14: { this.MasterWorkReqTypesData = data.slice(); break; }
        case 15: { this.MasterDepartmentsData = data.slice(); break; }
        case 16: { this.MasterWoSecurityData = data.slice(); break; }
    }
}

async loadLargeMTs(numStr: string) {     
    this.loadLargeMtCmd == '';
    this.MtSubscriptionSvc.execTriggerGetStoreNextLargeMT(0);
}

loadMissingLargeMTs() {
    this.loadLargeMtCmd == 'missing';
    this.missingLargeMTs = [];
    let LSOname = '';
    //alert('loadMissingLargeMTs');
    for (var i = 0; i <= this.idxOfLastLargeMT; i++ ) {
        LSOname = this.getMTlsoName(i);
        if (!this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            this.missingLargeMTs.push(i);
        }
    }
    if (this.missingLargeMTs.length > 0) {        
        alert('You need to load '+this.missingLargeMTs.length.toString()+' large Master Tables. Please be prepared for a delay');
       
        this.MtSubscriptionSvc.execTriggerGetStoreNextLargeMT(0);
    }
    else {
        this.MtSubscriptionSvc.execTriggerGetStoreNextLargeMT(0); // still needed to load from LSO
    }
}

loadMissingSmallMTs(loadAllMTs?: boolean) {
    this.loadSmallMtCmd == 'missing';
    this.missingSmallMTs = [];
    const idxOfLastMT = this.masterTableList.length-1;
    let LSOname = '';
    //alert('loadMissingSmallMTs');
    var startIdx = this.idxOfLastLargeMT+1;
    if (loadAllMTs) startIdx = 0;
    for (var i = startIdx; i <= idxOfLastMT; i++ ) {
        LSOname = this.getMTlsoName(i);
        if (!this.lsoRequestsSvc.isTableInLocalStorage(LSOname)) {
            //console.log('**REMOVE - the following table is NOT in L/S: ', LSOname);
            this.missingSmallMTs.push(i);
        }
    }
    this.MtSubscriptionSvc.execTriggerGetStoreNextSmallMT(startIdx); // still needed to load from LSO
}

loadAllSmallMasterTables() {
    this.missingSmallMTs.length = 0; // this will indicate ALL small MTs are to be loaded

    this.MtSubscriptionSvc.execTriggerGetStoreNextSmallMT(this.idxOfLastLargeMT+1);
}


setMTobjsToLSO(includeLargeMTs: boolean) {
    let startIdx = 5;
    if (includeLargeMTs) startIdx = 0;
    for (let mtIdx = startIdx; mtIdx < this.masterTableList.length; mtIdx++) { 
        //console.log('**REMOVE** setMTobjsToLSO, handling mtidx:', mtIdx);
        if (this.getNumRecsMasterTable(mtIdx) === 0) {
            let timeWait = 60;
            if (mtIdx < 5) timeWait = 1000;
            this.MtSubscriptionSvc.execTriggerSetMTobjToLSOdata(mtIdx, timeWait);
        }
    }
}

  doTableMaintenance() {
      var tableMaintenanceData = new TableMaintenanceModel([]);
      if (!this.lsoRequestsSvc.syncDbName || this.lsoRequestsSvc.syncDbName == "" ) {
          //alert('Cannot perform Table Maintenance: SyncDB name is null'); /** NEED FIX** */
          return;
      }
      // 1st -> check if need to remove/reload any MTs...
      const syncDbName = this.lsoRequestsSvc.syncDbName;
      const tblMaintLSOname = "tableMaintenance-"+syncDbName;

      // check that "tableMaintenance-<syncDbNmae>" exists, if not create it
      if (this.lsoRequestsSvc.isTableInLocalStorage(tblMaintLSOname)) { // LSO exists
        this.lsoRequestsSvc.getDataFromLocalStorage(tblMaintLSOname)
        .then ((data)=> { 
            tableMaintenanceData = data;
            //console.log('**REMOVE , tableMaintenanceData=>', tableMaintenanceData);
            for (let i = 0; i < environment.ResetMTs.length; i++) {
                const lsoMTname = environment.ResetMTs[i].mtName+'-'+syncDbName;           
                const foundIdx = tableMaintenanceData.lastReloadedInfo.findIndex( el => el.tableName == lsoMTname);
                if (foundIdx > -1) {
                    // check if last reloaded version no. is more recent than
                    const needs2bRemoved = !this.utilitiesSvc.cmpVersionStrings(tableMaintenanceData.lastReloadedInfo[foundIdx].versionNum,
                        environment.ResetMTs[i].resetVersion);
                    //console.log('**REMOVE found '+lsoMTname+' in tableMaintenance LSO, needs to be removed: ', needs2bRemoved);
                    if (needs2bRemoved) {
                        this.lsoRequestsSvc.removeLSObject(lsoMTname);
                    }
                }
                tableMaintenanceData.lastReloadedInfo.push(
                    new LastReloadedInfo(lsoMTname, 
                            environment.ResetMTs[i].resetVersion,
                            this.utilitiesSvc.getCurrDateStr()));
            }
            // ** 
            this.lsoRequestsSvc.storeDataInLocalStorage(tableMaintenanceData, tblMaintLSOname);
        })
      }
      else { // create the LSO 
        tableMaintenanceData.lastReloadedInfo = [];
        for (let i = 0; i < environment.ResetMTs.length; i++) {
            const lsoMTname = environment.ResetMTs[i].mtName+'-'+syncDbName;
            this.lsoRequestsSvc.removeLSObject(lsoMTname);
            tableMaintenanceData.lastReloadedInfo.push(
                new LastReloadedInfo(lsoMTname, 
                        environment.ResetMTs[i].resetVersion,
                        this.utilitiesSvc.getCurrDateStr()));
            //console.log('**REMOVE no tableMaintenanceData found, so created it');
        }
        //console.log('**REMOVE no tableMaintenanceData found, so created:', tableMaintenanceData);
        this.lsoRequestsSvc.storeDataInLocalStorage(tableMaintenanceData, tblMaintLSOname);
    }
  }

  // ** Supportive functions

    getMTlsoName(mtIdx): string {
        return this.masterTableList[mtIdx]+'-'+this.lsoRequestsSvc.syncDbName;
    }
    
    // *** MOVE FOLLOWING CODE TO LSO-REQUESTS-SVC ...
    getDataFromLocalStorage(keyStr: string): any {
        let dataArray = [];
        console.log('getDataFromLocalStorage - BEFORE GET...');
        this.storage.get(keyStr).then(data => {
          for ( let item in data ) {
            dataArray.push(data[item]);
          }
          console.log('getDataFROMlocalStorage for '+keyStr+' ==>', dataArray);
        }).catch(err => console.log('ERROR: UNABLE to load from offline storage for '+keyStr, err ));
    
        return dataArray;            
      }

    

  ngOnDestroy() {
    this.triggerGetStoreNextLargeMTSubscription.unsubscribe();
    this.triggerGetStoreNextSmallMTSubscription.unsubscribe();
    this.trigger2SetMTobjFromLSOSubscription.unsubscribe();
  }
}
