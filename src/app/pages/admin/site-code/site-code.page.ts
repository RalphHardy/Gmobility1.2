import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';

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
import { FirebaseSvc } from '../../../services/firebase-svc';
import { environment } from '../../../../environments/environment';

//* Pages
import { DisplayLsoPage } from '../../../pages/maint/display-lso/display-lso.page';
import { ResetLsoPage } from '../../../pages/maint/reset-lso/reset-lso.page';
import { CheckWoLsoPage } from '../../../pages/maint/check-wo-lso/check-wo-lso.page';

@Component({
  selector: 'app-site-code',
  templateUrl: './site-code.page.html',
  styleUrls: ['./site-code.page.scss'],
})
export class SiteCodePage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private viewCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private utilitiesSvc: UtilitiesSvc,
    private alertCtrl: AlertController,
    private actionSheetController: ActionSheetController, 
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private connectionSvc: ConnectionSvc,
    private firebaseSvc: FirebaseSvc
  ) { }

  //component data
  private PageTitle: string = 'Site Key & Code';

  // presentation
  private pageFormGroup: FormGroup;
  private siteAccessInfo: SiteAccessInfo;
  private deviceSerialNumber = "";
  private urlString = "";
  private syncDbName = "";

  // processing
  private siteAccessChanged = false;

  fireBaseAccess() {
    const fV = this.pageFormGroup.value;
    this.firebaseSvc.readSiteAccessInfo(fV.siteCode, fV.accessKey)
    .then (res => {

      console.log('firebaseSvc.readSiteAccessInfo: result => true', );
    },
    err => {

      console.log('firebaseSvc.readSiteAccessInfo: result => FALSE');
    } );
    
  }
  /* ****** */
  goBack() {
    console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }
  
  closePage() {
    console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }

  onAccept() {
    //console.log('currItemSelected');
    // const currEquipSelected = this.currEquipHierarchy[this.currLevel];
    this.viewCtrl.dismiss(this.pageFormGroup.value.siteCode);
  }
  

  async presentAlert() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Submit this site code and access key?',
      buttons: [
        {
          text: 'Yes',
          handler: () => { 
            console.log('Submitting ...');
            const fV = this.pageFormGroup;
            const cLoginName = this.utilitiesSvc.removeLeadingTrailingSpaces(fV.value.siteCode);
            const cPassword = this.utilitiesSvc.removeLeadingTrailingSpaces(fV.value.accessKey);
            fV.get('siteCode').setValue(cLoginName);
            fV.get('accessKey').setValue(cPassword);
            this.myLoader.present('Getting Site Access Info...');
            this.firebaseSvc.readSiteAccessInfo(cLoginName, cPassword)
            .then (res => {
        
              console.log('result => ', res, this.firebaseSvc.FbSiteAccessData);
              this.utilitiesSvc.copyPropertiesObj2Obj(this.firebaseSvc.FbSiteAccessData, this.applicVarsSvc.siteAccessInfo);
              console.log( '**REMOVE: Site Access Data from SERVER -->', this.applicVarsSvc.siteAccessInfo);
              this.lsoRequestsSvc.setSyncDbName(this.applicVarsSvc.siteAccessInfo.siteSyncDbName); 
              this.httpRequestsSvc.setSiteServerUrl(this.applicVarsSvc.siteAccessInfo.siteServerUrl);
              //console.log('siteAccessLSOName =>', this.lsoRequestsSvc.siteAccessInfoLSOname); 
              this.urlString = this.httpRequestsSvc.getSiteServerUrl();
              this.syncDbName = this.applicVarsSvc.getCurrDbName();
              this.lsoRequestsSvc.storeDataInLocalStorage(this.applicVarsSvc.siteAccessInfo, this.lsoRequestsSvc.siteAccessInfoLSOname);                
              this.siteAccessChanged = false;    
              this.myLoader.dismiss();
              alert("You're good to go!");
            },
            error=> {        
              console.log('result => FALSE');      
              alert('Unable to verify Access Code & Key');     
              this.myLoader.dismiss();
            } );


            // call API to getSiteInfo ...
            /*
            this.httpRequestsSvc.getSiteServerConnectionData(fV.siteCode, fV.accessKey)
            .subscribe(
            (data) => { 
              const rtnResult = data;
              this.myLoader.dismiss();
              if (rtnResult['siteAbbrevName'] == "") alert('Code/Key not found. Please try again');
              else {
                console.log( '**REMOVE: Site Access Data from SERVER -->', data);
                this.utilitiesSvc.copyPropertiesObj2Obj(rtnResult, this.applicVarsSvc.siteAccessInfo);
                console.log( '**REMOVE: Site Access Data from SERVER -->', this.applicVarsSvc.siteAccessInfo);
                this.lsoRequestsSvc.setSyncDbName(this.applicVarsSvc.siteAccessInfo.siteSyncDbName); 
                this.httpRequestsSvc.setSiteServerUrl(this.applicVarsSvc.siteAccessInfo.siteServerUrl);
                //console.log('siteAccessLSOName =>', this.lsoRequestsSvc.siteAccessInfoLSOname); 
                this.urlString = this.httpRequestsSvc.getSiteServerUrl();
                this.syncDbName = this.applicVarsSvc.getCurrDbName();
                this.lsoRequestsSvc.storeDataInLocalStorage(this.applicVarsSvc.siteAccessInfo, 
                    this.lsoRequestsSvc.siteAccessInfoLSOname);                
                this.siteAccessChanged = false;
                alert("You're good to go!");
              }

            },
            (error) => {              
              this.myLoader.dismiss();
              alert('HTTP Error: '+error.status+' trying to reach '+error.url) 
            }
            ) */
          }
        },
        { 
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary'
        }
      ]
    });
    await confirmAlert.present();
  }

  onSubmit(){
    const myDeviceSN = this.connectionSvc.deviceHdwId;
    if (this.pageFormGroup.valid) {
      

    }
 }
 private apiVersion: string;
 ionViewDidEnter() {
   this.deviceSerialNumber = this.connectionSvc.deviceHdwId;    
   const siteCode = this.applicVarsSvc.siteAccessInfo.siteAbbrevName;
   //this.pageFormGroup.get('siteCOde').setValue(siteCode.toUpperCase());
   this.urlString = this.httpRequestsSvc.getSiteServerUrl();
   this.syncDbName = this.applicVarsSvc.getCurrDbName();
   this.httpRequestsSvc.getApiVersion().subscribe( (data)=> {
     this.apiVersion = data['Description'];
     console.log('APIVersion =>', data);
   });    
 }
  
  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    //console.log('vStr =', vStr, value);
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
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

  async openResetLsoPage() {  
      
    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: ResetLsoPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from openResetLsoPage')
      });
    return await modalPage.present();
  } 

  async openCheckWoLsoPage() {  
      
    var data = { message : 'hello world' };
    const modalPage = await this.modalCtrl.create({
      component: CheckWoLsoPage, 
      componentProps:{values: data}
    });

    modalPage.onDidDismiss()
      .then ((rtnValue:any) => {
        console.log('Returned from CheckWoLsoPage')
      });
    return await modalPage.present();
  } 


  async selectMenuItem() {
    const actionSheet = await this.actionSheetController.create({
        buttons: [{
                text: 'Clear Local Storage',
                handler: () => {
                  this.openResetLsoPage();
                  //this.navCtrl.navigateForward('tabs/login/reset-lso');
                }
            },
            {
                text: 'Display Local Storage Tables',
                handler: () => {
                  this.openDisplayLsoPage();
                  //this.navCtrl.navigateForward('tabs/login/display-lso');
                }
            },
            {
                text: 'Check Work Orders',
                handler: () => {
                  this.openCheckWoLsoPage();
                  //this.navCtrl.navigateForward('tabs/login/display-lso');
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

	ngOnInit() {

		this.pageFormGroup = this.formBuilder.group({
			'siteCode': ['', Validators.required],
      'accessKey': ['', Validators.required]
    }); 

    this.pageFormGroup.valueChanges
    .subscribe( ( )=> {
      this.siteAccessChanged = true;
    } );     
  }

}
/*
  <ion-item>
    <ion-button expand="full" (click)="fireBaseAccess()">
      Firebase Access
    </ion-button>
  </ion-item>
*/