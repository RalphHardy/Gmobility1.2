import { Component, OnInit } from '@angular/core';
import { ModalController, MenuController, NavController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

//Services
import { UtilitiesSvc } from '../../../../services/utilities.svc';
import { ConnectionSvc } from '../../../../services/connection.svc';
import { LsoRequestsService } from '../../../../services/lso-requests.service';
import { HttpRequestsService } from '../../../../services/http-requests.service';
import { ApplicVarsSvc } from '../../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../../services/master-table-data.svc';
import { WorkRequestDataSvc } from '../../../../services/work-request-data.svc';
import { LoadingService } from '../../../../services/loading.service';

//Models
import { WorkRequestModel } from '../../../../models/work-request-model';

//Pages

import { WorkReqPage } from '../work-req/work-req.page';

//Data
import { environment } from '../../../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-work-requests',
  templateUrl: './work-requests.page.html',
  styleUrls: ['./work-requests.page.scss'],
})
export class WorkRequestsPage implements OnInit {
  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private myLoader: LoadingService,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private lsoRequestsSvc: LsoRequestsService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workRequestDataSvc: WorkRequestDataSvc
  ) { }

  //component data
  private woNum: string = '';
  private PageTitle: string = 'Work Requests';
  private workRequestList: WorkRequestModel[] = [];

  // processing data
  private initialEntry = true;
  private firstTimeLeaving = true;
  private currWrIdx = 0;
  private currUserId: number;
  private pressedChangeStatusBtn = false;

  // presentation

  addEditWorkRequest(idx: number) {
    this.navCtrl.navigateForward("tabs/work-requests/work-req/"+idx.toString() );
  } 

  sendToServer(idx: number) {
    this.presentAlert(idx);
  }
   
  async presentAlert(WRidx: number) {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Alert',
      message: 'Confirm add new work request',
      buttons: [
        {
          // copy fields to 
          text: 'Yes',
          handler: () => { 

            console.log('Submitting ...');
            this.myLoader.present('Sending to server ...');

            this.httpRequestsSvc.handlePostWorkRequest(this.workRequestList[WRidx])
            .subscribe( //*1
              <WorkorderModel>(data) => {
                console.log('Sent to server: ', data);
                if (data.Code == 0) {
                  // save W/O Req# returned from API
                  this.workRequestList[WRidx].WorkReqNum = data.WoReqNum;
                  this.workRequestList[WRidx].Sent2ServerDateTime = this.utilitiesSvc.getCurrDateStr();

                  // now move on to send any WR attachments ...
                  const LSOname = this.lsoRequestsSvc.workRequestsLSOname;  
                  
                  this.lsoRequestsSvc.storeObj2Lso(this.workRequestList, LSOname)
                    .then ((success)=> {
                      
                      this.myLoader.dismiss();
                      //setTimeout(()=>this.closePage(), 500);
                    }, // (success) {} (after storing in LS)
                  (error)=> {alert('Error: could not save WO to local storage');
                    this.myLoader.dismiss();}
                  ) // end of .then (storing LSO)
    

                }
                else {
                  alert('Error sending Work Request to Server');
                }
                
              },        
              (err) => {
                this.myLoader.dismiss();
                // Abandon further processing
                alert('ERROR: Unable to save to server!');
              } 
            ); 

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


  getWoPanelColor(WR: WorkRequestModel)  {
    let pnlColor = 'button-action';
    return pnlColor;
  }

  ionViewDidEnter() {
    this.workRequestDataSvc.getWorkRequestsFromLS()
    .then ((data) => {
      var updatedDate = false;
      this.workRequestList = <WorkRequestModel[]>data;
      this.workRequestList.
        forEach((wr)=>
        { if (wr.WorkReqNum !=='') { // only process work reqs sent to server
            if (wr.Sent2ServerDateTime =='') 
              {wr.Sent2ServerDateTime = this.utilitiesSvc.getCurrDateStr()} 
            else  {
              const sentDate = new Date(wr.Sent2ServerDateTime);
              const currDate = this.utilitiesSvc.currDateOnly();
              const diffDays = currDate.getDate() - sentDate.getDate();
              console.log('curr & 7days =>', sentDate, currDate, diffDays);
            }
          }
        })

      console.log('ionViewDidEnter -->', data)
    }); 
  }
  
  ngOnInit() {
    this.currUserId = this.applicVarsSvc.getLoginUserId();
  }

}
