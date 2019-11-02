import { Component, OnInit } from '@angular/core';
import { NgForm, FormArray, FormsModule, FormGroup, FormControl, Validators } from "@angular/forms";
import { IonicModule, MenuController, NavController,
   ModalController, AlertController, NavParams } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WoDatesModel  } from '../../../models/workorder-model';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-wo-dates',
  templateUrl: './wo-dates.page.html'
})
export class WoDatesPage implements OnInit {

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private params: NavParams,
    private viewCtrl: ModalController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private workorderDataSvc: WorkorderDataSvc) {
      this.woDates = params.get('woDates');
      console.log('**REMOVE - param editWO =>', this.woDates);
    }
  //component data
  private PageTitle: string = 'Workorder Dates';

 
  //presentation data
  private pageFormGroup: FormGroup;
  private woDates: WoDatesModel;


  //processing 

  goBack() {
    
    this.viewCtrl.dismiss(this.woDates);
  }
  

  ionViewDidLoad() {
    //console.log('ionViewDidLoad SiteCodeKeyPage');

    //this.pageFormGroup.get('siteCode').setValue(this.navParams.get('siteCode'));
  }

	ionViewDidEnter() {
    const fV = this.pageFormGroup;
    fV.get('dateRequired').setValue(this.woDates.DateRequired);
    fV.get('startDate').setValue(this.woDates.StartDate);
    fV.get('dateResponded').setValue(this.woDates.RespondedDateTime);
    fV.get('dateReported').setValue(this.woDates.ReportedDateTime);
    fV.get('dateCompleted').setValue(this.woDates.CompletedDate);
  }
  
  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'dateRequired': new FormControl(''),
      'startDate': new FormControl(''),
      'dateResponded': new FormControl(''),
      'dateReported': new FormControl(''),
      'dateCompleted': new FormControl('')      
    });
  }

}

