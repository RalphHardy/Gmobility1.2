import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, MenuController, NavController, ModalController,
      AlertController, ActionSheetController, ToastController, LoadingController} from '@ionic/angular';


import { HttpClient } from '@angular/common/http';

//Services

import { HttpRequestsService } from '../../../services/http-requests.service';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { LoadingService } from '../../../services/loading.service';

import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';
import { WoAttachFilesModel, AttachFilesLsoModel, DeviceImagesLsoModel } from '../../../models/wo-attach-files-model'

//Plugins

import { Storage } from '@ionic/storage';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { File, FileEntry } from '@ionic-native/File/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';

import { DocumentViewer,DocumentViewerOptions  } from '@ionic-native/document-viewer/ngx';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { Base64 } from '@ionic-native/base64/ngx';

//Pages

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
import { debug } from 'util';

const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

const IMAGES_STORAGE_KEY = 'images';
const ATTACHMENTS_STORAGE_KEY = 'attachments';

@Component({
  selector: 'app-wo-attach',
  templateUrl: './wo-attach.page.html',
  styleUrls: ['./wo-attach.page.scss'],
})

export class WoAttachPage implements OnInit {

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetController: ActionSheetController, 
    private toastController: ToastController,

    private storage: Storage, 
    private camera: Camera, 
    private file: File,     
    private transfer: FileTransfer,
    private webview: WebView,
    private photoViewer: PhotoViewer,
    private document: DocumentViewer,
    private fileOpener: FileOpener,
    private base64: Base64,

    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader: LoadingService,

    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc
  ) { }
  
  //component data
  private PageTitle = 'Notes';

  // processing data
  private initialEntry = true;
  private currWO: WorkorderModel;
  private allowEdit = true;

  private images: DeviceImagesLsoModel[] = [];
  private otherAttachments: AttachFilesLsoModel[] = [];
  private attachments: AttachFilesLsoModel[] = [];

  //private noteEditPage = WoNoteEditPage;
  private currWoNum = '';
  private woAttachDirPath: string = '';
  private subDirName: string = '';
  
  
  goBack() {
    const url=this.connectionSvc.getParentRoot();
  
    this.navCtrl.navigateBack("/tabs/sel-workorder");
  }


  //-----------------------------------------------------------------------
  // UTILITIES
   
  getLastToken(src: string, tokenChar: string): string {
    let idx = src.lastIndexOf(tokenChar)+1;
    if (idx == -1) idx = 0;
    console.log('getLastToken', src, idx, src.substr(idx));
    return src.substr(idx);
  }
  
  createFileName() {
    var d = new Date(),
        n = d.getTime(),
        newFileName = n + ".jpg";
    return newFileName;
    }

    copyFileToLocalDir(fromPath, currentName, newFileName) {
      
      this.utilitiesSvc.debugAlert(false,'copyFileToLocalDir', 
      'namePath='+fromPath+
      ', currentName='+currentName+
      ', dataDirectory='+this.woAttachDirPath+
      ', newFileName='+newFileName); 
      // file:///storage/emulated/0/Android/data/io.ionic.starter/cache/
      // 20190105_123350.jpg?154748401539
      // file:///data/user/0/io.ionic.starter/file/
      // 1547484015362.jpg

      this.file.copyFile(fromPath, currentName, this.woAttachDirPath, newFileName)
        .then(success => {
          this.addImage2Array(newFileName);
          alert('Image added to Unattached List');
        }, error => {
          this.presentToast('Error while copying file');
          alert('ERROR copying image:'+JSON.stringify(error));
      });
    }
    
    pareFileName(srcFileName: string): string {
      const pareIdx = srcFileName.indexOf('?');
      if (pareIdx == -1) {  
        return srcFileName;    
      }
      else { 
        return srcFileName.substring(0, pareIdx);
      }
    }



  
  //-----------------------------------------------------------------------
  // IMAGE-HANDLING
   
  takePicture(sourceType: PictureSourceType) {
    var options: CameraOptions = {
        quality: 100,
        sourceType: sourceType,
        saveToPhotoAlbum: false,
        correctOrientation: true
    };
  
    this.camera.getPicture(options).then(imagePath => {
        var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
        const paredFileName = this.pareFileName(currentName);
        var correctedPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
        this.copyFileToLocalDir(correctedPath, paredFileName, this.createFileName());
    });
  }
  
  //-----------------------------------------------------------------------
  // U-I

  async presentToast(text) {
    const toast = await this.toastController.create({
        message: text,
        position: 'bottom',
        duration: 3000
    });
    toast.present();
  }
  
  displayPhoto(filePathname: string, imageName: string) 
    {//this.file.dataDirectory + 'image.jpeg';	
    //alert('photo viewer, pic file/path='+filePathname);
    this.photoViewer.show(filePathname,imageName, {share: true});
  }
   
  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
        header: "Select Image source",
        buttons: [{
                text: 'Load from Library',
                handler: () => {
                    this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
                }
            },
            {
                text: 'Use Camera',
                handler: () => {
                    this.takePicture(this.camera.PictureSourceType.CAMERA);
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
  //-----------------------------------------------------------------------
  // IMAGE STORAGE

  addImage2Array(imageName) { //updateStoredImages
    let found = false;
    for (let i = 0; i<this.images.length; i++) {
      if (this.images[i].ImageName == imageName) {
        found = true; break;
      }
    }

    //'Add Image to Array: found=>'+String(found));
    if (found) return;
    // else carry on ...

    const dirName = this.woAttachDirPath;
    const pathName = dirName +'/'+imageName;

    const newImageObj = new DeviceImagesLsoModel(
      imageName,
      dirName,
      pathName,
      this.webview.convertFileSrc(pathName)
    );
    const tmpImages: DeviceImagesLsoModel[] = [];
    // put newest image at "top" of array/view ...
    tmpImages.push(newImageObj);
    for (let i = 0; i <  this.images.length; i++) tmpImages.push(this.images[i]);
    this.images.length=0;
    this.images = tmpImages.slice();
    this.lsoRequestsSvc.storeObj2Lso(this.images, IMAGES_STORAGE_KEY)
      .then (()=> this.utilitiesSvc.debugAlert(false, 'Stored image obj', JSON.stringify(this.images)));
    
    // this kludge to get shadow dom to re-render child component view display
    this.changeDetectorRef.detectChanges(); // trigger change detection cycle

  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      let converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  loadImageArray() {
    this.storage.get(IMAGES_STORAGE_KEY).then((data) => {
      this.utilitiesSvc.debugAlert(false, 'loadStoredImages', data);
      if (data && data.length > 0) { this.images = data; }
      else this.images.length = 0;
    });
  }

  //-----------------------------------------------------------------------
  // ATTACHMENT STORAGE

  findAttachObjIdx(lineId: number): number {
    for (let i=0; i < this.attachments.length; i++) {
      if (this.attachments[i].MobLineId == lineId) return i;
    }
    return -1;
  }
  addAttachmentObj(woAttch: WoAttachFilesModel,  deviceFileExists: boolean, 
        need2Send2Server: boolean) {
    const fName = this.getLastToken(woAttch.FileName, '\\');
    let url = '';
    if (deviceFileExists) url = 
      this.webview.convertFileSrc(this.woAttachDirPath+fName);

    this.attachments.push(new AttachFilesLsoModel(
      woAttch.MobLineId,
      woAttch.MobDispSeq,
      false,              // not used
      deviceFileExists,   // RetrievedFromServer       
      need2Send2Server,   // Need2Send2Server
      this.currWoNum,
      fName, //FileName
      this.woAttachDirPath, 
      this.woAttachDirPath + fName,
      url, // UrlPathName
     ));
     this.lsoRequestsSvc.storeDataInLocalStorage(this.attachments, ATTACHMENTS_STORAGE_KEY);
     this.utilitiesSvc.debugAlert(false,'addAttch',JSON.stringify(this.attachments));  
  }

  ifMobLineIdExists(attArr: any, mobLineId: number): boolean {
    for (let i=0; i < attArr.length; i++) {
      if (attArr[i].MobLineId === mobLineId)
        return true;
    }
    return false;
  }

  load_2() {
    this.utilitiesSvc.debugAlert(false, 'Not created Dir', this.file.dataDirectory+this.subDirName); 
    this.updateAttachFileExists();

    setTimeout(()=> {     
      const newAllAttchmtsArr = [...this.otherAttachments, ...this.attachments];
      this.lsoRequestsSvc.storeDataInLocalStorage(newAllAttchmtsArr, ATTACHMENTS_STORAGE_KEY);
      setTimeout(()=>  
        this.storage.get(ATTACHMENTS_STORAGE_KEY)
        .then ((data)=> {this.utilitiesSvc.debugAlert(false, 'After LSO saved:', JSON.stringify(data))} 
      ), 250
      );     
    }, 1000); 

  }

  load_1(lsoAttachArr: AttachFilesLsoModel[]) { // called after reading LSO attachments
    //** PHASE I -- load/create attachments-arr objects
    //console.log('**Attachments-arr ->', data);
    if (lsoAttachArr !== null && lsoAttachArr.length > 0) {
      this.utilitiesSvc.debugAlert(false, 'Retrieved atts', JSON.stringify(lsoAttachArr));
      //alert('Load arrs-1: '+JSON.stringify(arrWoAttchMobLineIds));

      // separate objects from allAttachment into either attachments (for this W/O) or otherAttachments
      for (let attObj of lsoAttachArr) {
        //alert('Load arrs-2: '+JSON.stringify(allAttchObj));
        if ( attObj.WoNumber == this.currWoNum ) {
          if  ( !this.ifMobLineIdExists(this.attachments, attObj.MobLineId) &&  // do not insert duplicates
                this.ifMobLineIdExists(this.currWO.WoAttachFiles, attObj.MobLineId) ) // if exists in WO-attachFile-arr
            this.attachments.push(attObj); 
        }              
        else // found attach objects for other W/O(s)
          this.otherAttachments.push(attObj);
      }
    } // (data !== null && data.length > 0)   
    
    for (let attObj of this.currWO.WoAttachFiles) {
      if  ( !this.ifMobLineIdExists(this.attachments, attObj.MobLineId) )
      { // no attachments-arr obj found, create a new one
          const fName = this.getLastToken(attObj.FileName, '\\');
          //alert('loadAttachArray =>', fName, dirName, woAttch);
          this.addAttachmentObj(attObj, false, false);
          this.utilitiesSvc.debugAlert(false, 'Created Dir',
            'Did not find attachment objfor W/O Attachment LineID#'+attObj.MobLineId.toString()+'\n'+
            JSON.stringify(this.attachments));
      }
    } // foreach WoAttachFiles
    //console.log('** ARRAYS --> **', this.currWO.WoAttachFiles, this.attachments);
//** PHASE II -- 
    //create gmobility/<woNum> w/o attachment directory in Device file system...

    this.file.createDir(this.file.dataDirectory, this.subDirName, false)
    .then((result)=>{  
      this.load_2();
    },
    (err)=>{
      this.load_2();
    } ); // check if Dir exists  
  }

  loadAttachArrays() { 
    this.utilitiesSvc.debugAlert(false, 'data dir1', this.woAttachDirPath+', dir2: '+this.file.dataDirectory);
    //dir1: file:///data/user/0/io.ionic.starter/files/gmobility-M18-1015/
    //dir2: file:///data/user/0/io.ionic.starter/files/

    // make a list of MobLineIds from WoAttachments
    let arrWoAttchMobLineIds: Array<number> = [];
    for (let wo of this.currWO.WoAttachFiles) 
      arrWoAttchMobLineIds.push(wo.MobLineId); // save the LineId to check if any assessments objs exist w/o wo-attach

    this.storage.get(ATTACHMENTS_STORAGE_KEY)
    .then ((data)=>{
      this.load_1(data);
    }); // storage.get(ATTACHMENTS_STORAGE_KEY) 
  }
  
  updateAttachFileExists() {
    for (let attObj of this.attachments) {
      if ( attObj.FilePathName == "" ) {
        attObj.DeviceDirName = this.woAttachDirPath;
        const filePath = this.woAttachDirPath+attObj.FileName;
        var deviceFileExists = false;
        this.file.checkFile(filePath, attObj.FileName)
        .then((result)=>{    
          deviceFileExists = true;
          attObj.FilePathName = attObj.DeviceDirName + attObj.FileName;
          attObj.UrlPathName = 
              this.webview.convertFileSrc(attObj.FilePathName);
        }); // check if File exists    
      }
    }
  }

  updateAttachArray(attachIdx: number) {
    this.attachments[attachIdx].RetrievedFromServer = true;
    this.attachments[attachIdx].UrlPathName = 
        this.webview.convertFileSrc(this.woAttachDirPath+this.attachments[attachIdx].FileName);
    this.utilitiesSvc.debugAlert(false, 'UrlPathName', this.attachments[attachIdx].UrlPathName);

    // now copy info into storage array ...
    const newAllAttchmtsArr = [...this.otherAttachments, ...this.attachments];
    this.lsoRequestsSvc.storeDataInLocalStorage(newAllAttchmtsArr, ATTACHMENTS_STORAGE_KEY);

    //console.log('loadStoredAttachments-2', this.attachments);
  }
   
   
  //-----------------------------------------------------------------------
  // CLICK FUNCTIONS

  deleteImage(img) {
    // - delete image object from images-array
    this.myLoader.present('Deleting image ...', 3000);
    this.images.forEach( (item, index) => {
      if (item === img) {
        this.images.splice(index,1);
        this.file.removeFile(img.DeviceDirName, img.ImageName)
          .then((success)=> {
            this.lsoRequestsSvc.storeDataInLocalStorage(this.images, IMAGES_STORAGE_KEY);
            this.myLoader.dismiss();
          },
            (error)=> { 
              this.lsoRequestsSvc.storeDataInLocalStorage(this.images, IMAGES_STORAGE_KEY);
              this.myLoader.dismiss();
              alert('Error: failed to delete image file: '+img.ImageName);
              }  )
      } });
  }

  deleteUnsavedAttachment(attachIdx) {
    this.utilitiesSvc.debugAlert(false,'Delete unsaved attachment');
  }

  findAttachmentsArrIdx(mobLineId): number {
    for (let i = 0; i < this.attachments.length; i++) {
      if (this.attachments[i].WoNumber == this.currWoNum && this.attachments[i].MobLineId == mobLineId)
        { return i; }
    }
    return -1;
  }
  
  async moveImage2WoAttachment(img: DeviceImagesLsoModel){
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm adding image as attachment to this workorder',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 
            var debugStr = '';
            // - create and insert w/o attachment object into currWO.WoAttachFiles 
            const woAttachmentObj = this.workorderDataSvc.createAttachmentObject(); 
            woAttachmentObj.FileName = img.ImageName;
            woAttachmentObj.MobLineId = this.workorderDataSvc.findNextMobLineId(this.currWO.WoAttachFiles);
            woAttachmentObj.MobDispSeq = woAttachmentObj.MobLineId.toString();
            //this.utilitiesSvc.debugAlert(false, 'Next MobLineId:',  woAttachmentObj.MobLineId.toString() );         
          

            this.myLoader.present('Adding image as attachment ...', 1000);
            /*
            // ** #2 CREATE BASE64 STRING FOR IMAGE
            this.base64.encodeFile(img.FilePathName)
            .then((rawBase64: string) => {

              const beginIdx=rawBase64.indexOf('base64')+7;
              let base64File = rawBase64.substring(beginIdx);
              */

              this.workorderDataSvc.addAttachment(this.currWoNum, woAttachmentObj); // WO is flagged as Dirty
              const WoArray = this.workorderDataSvc.getWoDataObj();
              //alert('WoArray[1].attachments:'+JSON.stringify(WoArray[1].WoAttachFiles));
              const LSOname = this.lsoRequestsSvc.workordersLSOname;  
              debugStr='rawBase64 string OK'+'\n';

              // ** #1 SAVE THE W/O LSO
              this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
              .then ((success)=> {     
                debugStr=debugStr+'added WO to LS'+'\n';           
                //alert('Image path:'+img.FilePathName);
                //alert('Base64:'+base64Json);
                
                // - create and insert w/o attachment object into attachments-array
                this.addAttachmentObj(woAttachmentObj, true, true); // Need2Send2Server <-- TRUE
                debugStr=debugStr+'added to attachments array'+'\n';      
                setTimeout(()=> {
                  // - delete image object from images-array
                  this.images.forEach( (item, index) => { if (item === img) this.images.splice(index,1) });              
                  this.lsoRequestsSvc.storeDataInLocalStorage(this.images, IMAGES_STORAGE_KEY); 

                  debugStr=debugStr+'deleted from image array'+'\n'; 
                  this.utilitiesSvc.debugAlert(false, 'wo-attach.ts', debugStr);    
                  //this.utilitiesSvc.debugAlert(false, 'move Image to Server', debugStr);  
                  this.myLoader.dismiss();    
                }, 300); 
              }, // (success) {} (after storing in LS)
              (error)=> {alert('Error: could not save WO to local storage');
                this.myLoader.dismiss();}
              ); // end of .then (storing LSO)
      /* 
            }, (err) => {
              alert('Error: unable to create base64 image: '+img.FilePathName);
              this.myLoader.dismiss();
            });
                 
           **/
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

  viewPicOrPdf(attachIdx) {
    const attachObj = this.attachments[attachIdx];
    this.utilitiesSvc.debugAlert(false,'Opening img',attachObj.FilePathName);
    if ( attachObj.FileName.toUpperCase().indexOf('.PDF') > 0) {
      this.fileOpener.open(attachObj.FilePathName, 'application/pdf')
      .then(() => console.log('File is opened'))
      .catch(err => alert('Error opening file:'+JSON.stringify(err)));
    }
    else this.displayPhoto(attachObj.FilePathName, attachObj.FileName);
  }

  // ** RETRIEVE ATTACHMENT FROM SERVER
  retrieveWoAttachmentFromServer(attachIdx: number) {
    if (!this.httpRequestsSvc.connected2Server) {
      alert('Device must be online');
      return;
    }
    this.myLoader.present('Retrieving file from server ...', 15000);

    const attachFileName=this.attachments[attachIdx].FileName;
    const targetPathFilename = this.woAttachDirPath+attachFileName;

    // this.attachments[attachIdx].FilePathName;

    const url = this.httpRequestsSvc.getSiteServerUrl()+'getwoattachmenttemp/'+
      this.currWoNum+'/'+this.attachments[attachIdx].MobLineId.toString()+
        '/'+this.applicVarsSvc.getCurrDbName();
    this.utilitiesSvc.debugAlert(false,'Get fr/Server: targetPathFilename',targetPathFilename);
    //alert('File Transfer URL=>'+url);
    const fileTransfer: FileTransferObject = this.transfer.create();
    this.utilitiesSvc.debugAlert(false,'Get fr/Server: URL',url);
    fileTransfer.download(url, targetPathFilename)
    .then((entry) => {
        //alert('Copy file from: '+ this.file.dataDirectory+this.currWoNum+'/'+attachFileName
       // +' to '+ this.file.dataDirectory);

       this.updateAttachArray(attachIdx);                                   
       this.myLoader.dismiss();
       alert('Download complete');
      }, (error) => {                         
        this.myLoader.dismiss();
        alert('Download Error: '+JSON.stringify(error));    // handle error
      });

  }
  //-----------------------------------------------------------------------

  ionViewWillEnter() {
  }

  //-----------------------------------------------------------------------
  ngOnInit() {
    
    const parentRt = this.connectionSvc.getParentRoot();
    //console.log('W/O Attachment: this.route =>', parentRt, '['+this.utilitiesSvc.getLastToken(parentRt, '/')+']' );
      // this is testing ...
    this.currWO = this.workorderDataSvc.getCurrWO(); 
    this.currWoNum = this.currWO.WoNumber;
    this.PageTitle = 'WO '+this.currWoNum+' Attachments';  
    this.allowEdit = this.currWO.WoMobStatusId < 4;

    this.subDirName = 'gmobility-'+this.currWoNum+'/';
    this.woAttachDirPath = this.file.dataDirectory+this.subDirName;
    ///data/user/0/io.ionic.starter/files/gmobility=M18-1015/
    this.utilitiesSvc.debugAlert(false,'initial set of file.dataDirectory-1', this.woAttachDirPath);
    this.loadAttachArrays();
    setTimeout(()=> this.loadImageArray(),1500);
  }

}
// code examples: https://devdactic.com/ionic-4-image-upload-storage/
// Inspired by https://golb.hplar.ch/2017/02/Uploading-pictures-from-Ionic-2-to-Spring-Boot.html

