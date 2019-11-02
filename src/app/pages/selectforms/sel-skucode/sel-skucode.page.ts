import { Component, OnInit } from '@angular/core';
import { NgForm, FormArray, FormsModule, FormGroup, FormControl, Validators } from "@angular/forms";
import { IonicModule, MenuController, NavController,
   ModalController, AlertController } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';
import { MasterCatalogModel, CatalogSearchModel } from "../../../models/master-catalog-model";

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-sel-skucode',
  templateUrl: './sel-skucode.page.html',
  styleUrls: ['./sel-skucode.page.scss'],
})
export class SelSkucodePage implements OnInit {

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
  private PageTitle: string = 'Select Catalog Item';

 
  //presentation data
  private pageFormGroup: FormGroup;


  //processing 

  searchResult: CatalogSearchModel[] = [];

  private currItemSelected = new CatalogSearchModel('','','','','',0);


  goBack() {

    this.viewCtrl.dismiss(this.currItemSelected);
  }
  
  onAccept() {
    //console.log('currItemSelected');
    // const currEquipSelected = this.currEquipHierarchy[this.currLevel];
    this.viewCtrl.dismiss(this.currItemSelected);
  }

 onAcceptCatalogItem() {
  //console.log('currItemSelected', this.currItemSelected);
  // const currEquipSelected = this.currEquipHierarchy[this.currLevel];
  this.viewCtrl.dismiss(this.currItemSelected);
}

private loadItems(form: NgForm) {
  this.searchResult = this.masterTableDataSvc.loadSearchCatalogArray(form.value.skuCode, form.value.skuDesc, form.value.skuClass, '', '');
}

needSearchStrings(form: NgForm): boolean {
  return (form.value.skuCode || form.value.skuDesc || form.value.skuClass)
}

onClickItem(form: NgForm, index: number) {
  this.currItemSelected.SkuCode = this.searchResult[index].SkuCode;
  this.currItemSelected.ItemDesc = this.searchResult[index].ItemDesc;
  this.currItemSelected.ItemClass = this.searchResult[index].ItemClass;
  form.setValue({skuCode: this.searchResult[index].SkuCode,
    skuDesc: this.searchResult[index].ItemDesc,
    skuClass: this.searchResult[index].ItemClass} );

  //console.log('Clicked', index);
  this.viewCtrl.dismiss(this.currItemSelected);
  //setValue(this.searchResult[index].SkuCode);
  //form.value.get('skuClass').setValue(this.searchResult[index].ItemClass);
  //console.log('Clicked', index, this.searchResult[index].SkuCode);
}

  ionViewDidLoad() {
    //console.log('ionViewDidLoad SiteCodeKeyPage');

    //this.pageFormGroup.get('siteCode').setValue(this.navParams.get('siteCode'));
  }

	ionViewDidEnter() {
  }
  
  ngOnInit() {

  }

}
