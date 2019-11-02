import { Component, OnInit } from '@angular/core';
import { FormsModule, FormGroup, FormControl, Validators } from "@angular/forms";
import { IonicModule, MenuController, NavController,
   ModalController, AlertController } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { MasterEquipmentModel } from "../../../models/master-equipment-model";

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-sel-equipment',
  templateUrl: './sel-equipment.page.html',
  styleUrls: ['./sel-equipment.page.scss'],
})
export class SelEquipmentPage implements OnInit {

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private viewCtrl: ModalController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc) { }

  //component data
  private PageTitle: string = 'Select Equipment';

  //presentation data
  private pageFormGroup: FormGroup;


  //processing data
  private index: number;
  private currLevel = 0;
  private topParentId = 0;
  private currEquipId = 0;
  private currLevelOpts: MasterEquipmentModel[] = [];
  private currEquipHierarchy: MasterEquipmentModel[] = [];

  onAcceptEquipNum() {
    console.log('onAcceptEquipNum', this.currLevel);
    if (this.currLevel >= 0) {
      const currEquipSelected = this.currEquipHierarchy[this.currLevel];
      console.log('RETURNING VALUE ==>', this.currLevel, currEquipSelected);
      this.viewCtrl.dismiss(currEquipSelected);
    }
    else {
      const blankEquip = new MasterEquipmentModel(0,'',0,'','',0,'','');
      this.viewCtrl.dismiss(blankEquip);
    }
  }

  resetToLevel(thisLevel: number) {
    console.log('RESET TO LEVEL!! -->', thisLevel);
    this.currLevelOpts = [];
    // remove this level along with any "higher" ones from the hierarchy...
    const lastIdx: number =  this.currEquipHierarchy.length;
    for (this.currLevel = lastIdx; this.currLevel >= thisLevel; this.currLevel--) {
      this.currEquipHierarchy.splice(this.currLevel, 1);
      console.log('Resetting level ', this.currLevel);
    }
    //now get next level choices...
    if (this.currLevel >= 0) {
      const currEquipId = this.currEquipHierarchy[this.currLevel].EquipId;
      this.currLevelOpts = this.masterTableDataSvc.getChildrenOfEquip(currEquipId);
    }
  }


  onSelectItem(Idx: number) {
    // set the current level pointer to the level of the item selected
    this.currLevel = this.currLevelOpts[Idx].Level;
    
    // add this item to the hierarchy ...
    this.currEquipHierarchy.push(this.currLevelOpts[Idx]);
    this.currEquipId = this.currLevelOpts[Idx].EquipId;
    //console.log('>>>SELECTED ITEM:', Idx, this.currLevelOpts[Idx]);
    //now get next level choices...
    this.currLevelOpts = this.masterTableDataSvc.getChildrenOfEquip(this.currEquipId);
   
      //console.log('selEquipmentPage, got currLevelOpts -->', this.currLevelOpts);

  }

  onClose() {
      //console.log('REMOVE** LEAVING W/O SELECTING EQUIP!!!');
      const blankEquip = new MasterEquipmentModel(0,'',0,'','',0,'','');
      this.viewCtrl.dismiss(blankEquip);
  }

  handleTopLevelOpt() {
    console.log('currLevel ==>', this.currLevel);
      this.currLevelOpts = this.masterTableDataSvc.getTopEquipHierarchy();
    if (this.currLevelOpts.length == 1) {
      //console.log('* ONLY ONE TOP LEVEL OPTION FOUND **');
      this.currEquipHierarchy.push( this.currLevelOpts[0] ); 
      //console.log('currEquipHierarchy[0].EquipNum==>', this.currEquipHierarchy[0].EquipNum);
      this.topParentId = this.currEquipHierarchy[0].EquipId;
      //console.log('selEquipmentPage, got currLevelOpts -->', this.currLevelOpts);
      this.currLevelOpts = this.masterTableDataSvc.getChildrenOfEquip(this.topParentId);
      this.currLevel = 1;
    }
  }

  changeWoStatus() {
    
  }

	ionViewWillEnter() {
    
    const tblName = this.masterTableDataSvc.masterTableList[5];
    const arrEmptyTbls = this.applicVarsSvc.siteAccessInfo.siteConfig.emptyMasterTables;

    const idxEmptyTbl = arrEmptyTbls.indexOf(tblName);
    console.log('^^^^ LOGIN test check for Empty Table ->', tblName, idxEmptyTbl, arrEmptyTbls);
    const idxEmptyTbl1 = arrEmptyTbls.indexOf('Trades');
    console.log('^^^^ LOGIN test check for Empty Table ->', 'Trades', idxEmptyTbl1, arrEmptyTbls);
    
  }
  
  ngOnInit() {
    // check for Top/Division Level (lvl=0) 
    this.masterTableDataSvc.getTopEquipHierarchy();	
    // check for special case where there's only one (1) top level entity
    this.handleTopLevelOpt();

  }
}
