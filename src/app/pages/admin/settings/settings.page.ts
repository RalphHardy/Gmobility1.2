import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';

/* PWA Components */
import { ComponentsModule } from '../../../components/components.module';

//* Services
import { UtilitiesSvc } from '../../../services/utilities.svc'
import { HttpRequestsService } from '../../../services/http-requests.service';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { LoadingService } from '../../../services/loading.service';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';

//* Data Models
import { SiteAccessInfo } from '../../../models/app-vars-model';
import { environment } from '../../../../environments/environment';

//* Pages
import { DisplayLsoPage } from '../../../pages/maint/display-lso/display-lso.page';
  

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private viewCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private utilitiesSvc: UtilitiesSvc,
    private alertCtrl: AlertController,
    private actionSheetController: ActionSheetController, 
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private storage: Storage,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
		private connectionSvc: ConnectionSvc
  ) { }

  //component data
  private PageTitle: string = 'Settings';

  // presentation
  private pageFormGroup: FormGroup;
  private setHrsRoundingOpts = ['No Rounding', 'Round to nearest .25', 'Round to nearest .01'];

  // processing
  private formHasChanged = false;
  private firstTime = true;

  
  
  async presentAlert() {
    const fV = this.pageFormGroup.value;
    const rndHrsOpt = this.applicVarsSvc.getTimeCardRounding();
    const newSettingRndHrs = this.setHrsRoundingOpts.indexOf(fV.setHoursRounding);

    // check for changes ...
    if (!this.formHasChanged) {
      alert('No changes to save');
      return;
    }

    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm you wish new settings',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 
            this.myLoader.present('Saving settings ...');   
            this.applicVarsSvc.SetTimeCardRounding(newSettingRndHrs);       
            this.applicVarsSvc.setTimeCardRoundUp(fV.timeCardRoundUp);       

            this.applicVarsSvc.storeAppVarsInLocalStorage();
            this.formHasChanged = false;

            this.myLoader.dismiss();

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

  async openDisplayLsoPage() {  
      
    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: DisplayLsoPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from openDisplayLsoPage')
      });
    return await modalPage.present();
  } 

  prepSettings() {
    const fV=this.pageFormGroup.value;
    const rndOpt = this.applicVarsSvc.getTimeCardRounding();
    const newSettingRndHrs = this.setHrsRoundingOpts.indexOf(fV.setHoursRounding);
    console.log('get rounding setting ->', rndOpt);
    if (newSettingRndHrs !== rndOpt) {
      console.log('changed ==>', fV.setHoursRounding, this.setHrsRoundingOpts[rndOpt]);
      this.pageFormGroup.get('setHoursRounding').setValue(this.setHrsRoundingOpts[rndOpt]);     
    }
  }

  ionViewDidEnter() {
    this.prepSettings();
  }

  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'setHoursRounding': new FormControl('',[Validators.required]),
      'timeCardRoundUp': new FormControl(true),
        
    });
    

    this.pageFormGroup.valueChanges
    .subscribe( (value )=> {
      if (this.firstTime) 
        this.firstTime = false;
      else {
        this.formHasChanged = true;
        //console.log('SET FORMCHANGED NOT FIRSTTIME!!');
      }
    } );

    this.pageFormGroup.get('setHoursRounding').valueChanges
    .subscribe( (value )=> {
      //console.log('Value changed: ', this.pageFormGroup.get('setHoursRounding').value);      
    } );

    this.selectMenuItem();
  }

  async selectMenuItem() {
    const actionSheet = await this.actionSheetController.create({
        buttons: [{
                text: 'Settings',
                handler: () => {                  
                  this.prepSettings();
                }
            },
            {
                text: 'Display Local Storage Tables',
                handler: () => {
                  this.openDisplayLsoPage();
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
