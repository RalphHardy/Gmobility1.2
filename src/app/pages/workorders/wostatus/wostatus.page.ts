import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";
import { IonicModule, MenuController, 
      ModalController, AlertController,  NavController, NavParams } from '@ionic/angular';

//Services
import { ConnectionSvc } from '../../../services/connection.svc';
import { HttpRequestsService } from '../../../services/http-requests.service';
import { LsoRequestsService } from '../../../services/lso-requests.service';
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { LoadingService } from '../../../services/loading.service';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';
//Models
import { WorkorderModel } from '../../../models/workorder-model';


@Component({
  selector: 'app-wostatus',
  templateUrl: './wostatus.page.html',
  styleUrls: ['./wostatus.page.scss'],
})
export class WostatusPage implements OnInit {

  constructor(
    private viewCtrl: ModalController,
    private navParams: NavParams,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private utilitiesSvc: UtilitiesSvc,
    private myLoader: LoadingService,
    private applicVarsSvc: ApplicVarsSvc,
    private workorderDataSvc: WorkorderDataSvc
  ) { }

  private PageTitle: string = 'Change Status for ';
  private currWO: WorkorderModel = this.workorderDataSvc.createWorkorderObject();
  private currWoNum = ''; 
  private changeStatusOpts: Array<number> = [];
  private wipStatus: boolean = false;
  private completeStatus: boolean = false;
  private incompleteStatus: boolean = false;
  private statusOpts: Array<boolean> = [false, false, false, false, false, false]; // 0-th element is not used
  private woStatusCodes = this.workorderDataSvc.woStatusCodes;
  

  // presentation
  //private pageFormGroup: FormGroup;

  goBack() {
    const prevRoute = this.connectionSvc.getPrevRoute();
    if (prevRoute.indexOf('sel-workorder/workorder/')>-1)
      this.navCtrl.navigateBack("tabs/sel-workorder"); // kludge required bcuz selWorkorder.onClickWo() also fires when clicking selWorkorder.changeWoStatus() 
    this.viewCtrl.dismiss('');
  }

  setWoStatus(newStatus: number) {
    //console.log('setWoStatus ==>', newStatus);
    const currStatus = this.currWO.WoMobStatusId;
    const WoArray = this.workorderDataSvc.getWoDataObj();
    const currWoIdx = this.workorderDataSvc.findWoInArray(this.currWoNum);
    if ( (currStatus == 2) || (newStatus == 2) 
     || ( WoArray[currWoIdx].UrgentFlag ) ) { 
       // if IS in the pool or if being put into the pool || or IS an Urgent W/O
      // need to up to server
      this.presentAlert(newStatus);
    }
    else { // change status without needing to immediately sync to server
      this.myLoader.present('Status changed ...',500);
      const currWoInstance = WoArray[currWoIdx];
      currWoInstance.WoMobStatusId = newStatus;
      currWoInstance.WoMobStatusDesc = this.workorderDataSvc.woStatusCodes[newStatus];
      //console.log('*^*^ WoMobStatusDesc=>'+currWoInstance.WoMobStatusDesc+'<=');

      currWoInstance.DirtyFlag = true;
      if (newStatus >= 4) {
        currWoInstance.CompletedDate = this.utilitiesSvc.getCurrDateTimeStr();
        if (this.utilitiesSvc.debugIssue('')) 
          console.log('completed date =', currWoInstance.CompletedDate);
      }

      const LSOname = this.lsoRequestsSvc.workordersLSOname; 
      this.lsoRequestsSvc.storeObj2Lso(WoArray, LSOname)
        .then ((success)=> {

          this.myLoader.dismiss();
          this.goBack();
        }, // (success) {} (after storing in LS)
       (error)=> {alert('Error: could not save WO to local storage');
        this.myLoader.dismiss();}
      ) // end of .then (storing LSO)

    } // updated only LSO
  }

  async presentAlert(newStatus: number) {
    let goBack = false;
    const newStatusDesc = this.workorderDataSvc.woStatusCodes[newStatus];
    var confirmMsg = 'Confirm changing status to '+newStatusDesc;
    if (this.currWO.UrgentFlag) confirmMsg = 'Confirm submission of urgent work order to server';
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: confirmMsg,
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 

            console.log('Submitting ...', this.httpRequestsSvc.connected2Server);
            const currWoIdx = this.workorderDataSvc.findWoInArray(this.currWoNum);
            const WoArray = this.workorderDataSvc.getWoDataObj();
            const currWO = WoArray[currWoIdx];

            currWO.WoMobStatusId = newStatus;
            currWO.WoMobStatusDesc = newStatusDesc;
            if (newStatus == 2) {
              currWO.AssignedToUserId = -1;
              currWO.LoginFullName = '';
              currWO.LoginName = '';
              //currWO.MobDevUserId = -1;
            }
            else { // was 2, now either 1 or 3, i.e., taken "out of the pool"
              currWO.AssignedToUserId = this.applicVarsSvc.getLoginUserId();
              currWO.LoginFullName = this.applicVarsSvc.getLoginName();
              currWO.LoginName = this.applicVarsSvc.getLoginName();
              currWO.MobDevUserId = this.applicVarsSvc.getMobDevUserId();
              const dispSeqStr = currWO.MobDispSeq;
              if (!dispSeqStr || dispSeqStr === "" )  
                currWO.MobDispSeq = this.workorderDataSvc.getNextMobDispSeq(currWoIdx);
                
              //if (currWO.WoLaborLines.length == 0) {  } // add a blank labor line
            }

      /*1*/ const currWoInstance = WoArray[currWoIdx];
            if (this.httpRequestsSvc.connected2Server) {
              this.myLoader.present('Saving change to status ...');
              this.httpRequestsSvc.handlePostWorkorder(currWoInstance)
              .subscribe( 
                <WorkorderModel>(Err) => {
                  console.log('**httpRequestsSvc.handlePostWorkorder success response(1): ', Err);

                  if (!Err.Code && Err.Code == 0) {
                    this.workorderDataSvc.saveWo2LSO(currWoIdx, false); //set DirtyFlag Off (false)
                    this.myLoader.dismiss();
                    goBack = true;
                  /* { // reset back to previous status ...
                    const currWoStatus = this.currWO.WoMobStatusId;

                    WoArray[currWoIdx].WoMobStatusId = currWoStatus;
                    WoArray[currWoIdx].WoMobStatusDesc = this.workorderDataSvc.woStatusCodes[currWoStatus];
                    this.myLoader.dismiss();
                    alert ('Failed to save status change to server because '+Code.toString());
                   } */
                  console.log('After SyncWorder =>', this.currWO);

                  }


                },        
                (err) => {
                  alert('ERROR: Unable to save to server!');
                  this.myLoader.dismiss();
                } 
                ) // subscribe to HTTP request
            } // if device-is-online
            if (goBack) this.goBack();
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

  ionViewDidEnter() {
    this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    if (this.currWO.UrgentFlag) this.PageTitle = 'Work Order '+this.currWoNum;
    this.changeStatusOpts = this.workorderDataSvc.getWoStatusChgOpts(this.currWoNum);
    for (let i = 0; i <= this.changeStatusOpts.length-1; i++) {
      this.statusOpts[this.changeStatusOpts[i]] = true;
    }
    console.log(' this.changeStatusOpts ->',  this.changeStatusOpts, this.statusOpts);

  }

  ngOnInit() {
    this.currWoNum = this.navParams.data.WoNum;
    this.PageTitle = 'Change Status for '+this.currWoNum;
  }

}
