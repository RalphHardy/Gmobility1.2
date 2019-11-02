import { Component, OnInit } from '@angular/core';

import { IonicModule, MenuController, NavController, 
  ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from "@angular/forms";

import { File } from '@ionic-native/File/ngx';

import { Storage } from '@ionic/storage';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { LoadingService } from '../../../services/loading.service';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';
import {  AttachFilesLsoModel, DeviceImagesLsoModel } from '../../../models/wo-attach-files-model';


//Pages

//Data
import { environment } from '../../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;
const noWoImages = 'none selected';
const IMAGES_STORAGE_KEY = 'images';
const ATTACHMENTS_STORAGE_KEY = 'attachments';

@Component({
  selector: 'app-reset-lso',
  templateUrl: './reset-lso.page.html',
  styleUrls: ['./reset-lso.page.scss'],
})

export class ResetLsoPage implements OnInit {
  //component data
  private PageTitle: string = 'Reset Local Storage Tables';

  //presentation data

  constructor(
    private menuCtrl: MenuController,
    private viewCtrl: ModalController,
    private navCtrl: NavController,
    private actionSheetController: ActionSheetController, 
    private alertCtrl: AlertController,
    private storage: Storage,
    private file: File,     
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc) { }

  //presentation data
  private pageFormGroup: FormGroup;
  private formHasChanged = false;

  //processing data
  private Workorders: WorkorderModel[] = [];
  private listOfWorkorders: Array<string> = [noWoImages];
  private woAttachDirPath: string = '';
  private subDirName: string = '';


  closePage() {
    console.log('Pressing CANCEL button');
    this.viewCtrl.dismiss('testing');
  }


  async presentAlert() {
    const fV=this.pageFormGroup.value;
    let msg='';
    //console.log('**REMOVE fV.clearWoImages=>', fV.clearWoImages);
    if (fV.clearAll) msg = 'all local storage tables';
    else {
      if (fV.clearAdmin) msg = 'admin';
      if (fV.clearMTs) msg = msg + ' master tables';
      if (fV.clearWorkorders) msg = msg + ' work orders';
    }
    if (fV.clearWoImages != noWoImages) msg = msg + 'images for W/O# '+ fV.clearWoImages;
    msg = this.utilitiesSvc.removeLeadingTrailingSpaces(msg);
    if (msg == '') {
      alert("You haven't selected anything!");
      return;
    }
    
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm you wish to clear '+msg,
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 
            this.connectionSvc.chgLoginState(false);
            this.myLoader.present('Clearing ...');
            

            this.storage.ready().then(() => {

              if (fV.clearWorkorders) {
                  this.storage.remove(this.lsoRequestsSvc.workordersLSOname)
                  .then (()=> {
                    alert('Work orders are cleared from Local Storage');  
                    }); 
              }

              if (fV.clearMTs) {
                const numMTsCleared =  this.masterTableDataSvc.clearMTsFromLSO();
                alert('Number of Master Tables cleared: '+numMTsCleared.toString());
              }

              if (fV.clearAll) {
                this.applicVarsSvc.clearLocalStorage(false);
                    alert('Local Storage is completely cleared');
                }
            });

            if (fV.clearWoImages != noWoImages) {
              this.subDirName = 'gmobility-'+fV.clearWoImages +'/';
              this.woAttachDirPath = this.file.dataDirectory+this.subDirName;
              this.utilitiesSvc.debugAlert(false, 'phone path', this.woAttachDirPath );
              this.file.checkDir(this.file.dataDirectory, this.subDirName)
              .then (()=>{
                this.utilitiesSvc.debugAlert(false,'direxists',this.woAttachDirPath )
                this.file.removeRecursively(this.file.dataDirectory, this.subDirName)
                .then ((rmSuccess)=>{
                  this.utilitiesSvc.debugAlert(false,'Recursive remove','Success!');
                  //now remove w/o objects from LSO attachments...
                  this.storage.get(ATTACHMENTS_STORAGE_KEY)
                  .then (<AttachFilesLsoModel>(lsoAttachArr)=>{
                    if (lsoAttachArr !== null && lsoAttachArr.length > 0) {
                      this.utilitiesSvc.debugAlert(false, 'Retrieved atts', JSON.stringify(lsoAttachArr));
                      
                      const attachments: AttachFilesLsoModel[] = [];
                
                      // separate objects from allAttachment into either attachments (for this W/O) or otherAttachments
                      for (let attObj of lsoAttachArr) 
                        if ( attObj.WoNumber != fV.clearWoImages ) {// if not the selected W/O
                            attachments.push(attObj); 
                      }
                      // now save the attachments back to LS without any objects for the selected W/O
                      this.lsoRequestsSvc.storeDataInLocalStorage(attachments, ATTACHMENTS_STORAGE_KEY);
                    } // (data !== null && data.length > 0)   

                    

                  }); // storage.get(ATTACHMENTS_STORAGE_KEY) 

                },
                (err)=>{
                  this.utilitiesSvc.debugAlert(false,'Recursive remove','Failure!');
                } );
              },
              (dirNotExists)=>{
                this.utilitiesSvc.debugAlert(false,'dir NOT exists',this.woAttachDirPath )
              }
            );

            }

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

  ngOnInit() {
    this.pageFormGroup = new FormGroup({
      'clearAll': new FormControl(false,[Validators.required]),
      'clearAdmin': new FormControl(false,[Validators.required]),
      'clearMTs': new FormControl(false,[Validators.required]),
      'clearWorkorders': new FormControl(false,[Validators.required]),
      'clearWoImages': new FormControl('none selected',[Validators.required])

    });


    this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workordersLSOname)
    .then (<WorkorderModel>(woData)=> {  
      for ( let wo in woData ) {
        const currWo = woData[wo];
        if (currWo.WoAttachFiles.length > 0)
          this.listOfWorkorders.push(currWo.WoNumber);
      }        
    } );

    this.pageFormGroup.valueChanges
    .subscribe( (value )=> {
      this.formHasChanged = true;
    } );

    this.pageFormGroup.get('clearAll').valueChanges
    .subscribe( (value )=> {
      this.pageFormGroup.get('clearAdmin').setValue(value);
      this.pageFormGroup.get('clearMTs').setValue(value);
      this.pageFormGroup.get('clearWorkorders').setValue(value);    
    } );
    this.pageFormGroup.get('clearWoImages').valueChanges
    .subscribe( (value )=> {
      console.log('clear W/O Images for', value);
      //this.utilitiesSvc.debugAlert(false,'clear W/O Images for', value);
    } );
  }

}
