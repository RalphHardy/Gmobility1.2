import { Component, OnInit } from '@angular/core';
import { ModalController, MenuController, NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { HttpRequestsService } from '../../../services/http-requests.service';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';

//Pages
import { WorkorderPage } from '../workorder/workorder.page';
import { WostatusPage } from '../wostatus/wostatus.page';
import { WorkorderCreatePage } from '../workorder-create/workorder-create.page';

//Data
import { environment } from '../../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;


@Component({
  selector: 'app-sel-workorder',
  templateUrl: './sel-workorder.page.html',
  styleUrls: ['./sel-workorder.page.scss'],
})

export class SelWorkorderPage implements OnInit {
  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private router: Router,
    private route: ActivatedRoute,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private httpRequestsSvc: HttpRequestsService,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc
  ) { }

  //component data
  private woNum: string = '';
  private PageTitle: string = '';
  private workorderList: WorkorderModel[] = [];

  // processing data
  private initialEntry = true;
  private firstTimeLeaving = true;
  private woSelected: WorkorderModel;
  private workstatus = "1";
  private currWoNum = '';
  private currUserId: number;
  private pressedChangeStatusBtn = false;

  onClickWo(woNum: string) {
    //  href="tabs/sel-workorder/workorder/{{WO.WoNumber}})"  
    this.workorderDataSvc.setCurrWo(woNum);
    this.navCtrl.navigateForward("tabs/sel-workorder/workorder/"+woNum );
  } 
  
  async changeWoStatus(WoNumber: string) {    
    const modalPage = await this.modalCtrl.create({
      component: WostatusPage,
      componentProps: { WoNum: WoNumber }
    });

    modalPage.onDidDismiss()
      .then((rtnValue: any) => {
        this.pressedChangeStatusBtn = false;
        //console.log('Returned from SiteCodePage')
        //alert('needSiteAccess='+JSON.stringify(this.needSiteAccess.valueOf)+'\nready2Login='+JSON.stringify(this.ready2Login) );
      });
    return await modalPage.present();
  }

  getWoPanelColor(Wo: WorkorderModel): string  {
    let pnlColor = 'button-action';
    const mobStatusId = Wo.WoMobStatusId;
    if (Wo.DirtyFlag) pnlColor = 'medium'
    else if (mobStatusId == 2) pnlColor = 'success'
    else if (mobStatusId == 4) pnlColor = 'danger'
    else if (mobStatusId == 5) pnlColor = 'warning'
    return pnlColor;
  }

  checkIfSelected(selectedOption: string, assignedToUserId: number, mobStatusId: number, woNum: string) {
    //console.log('##2-06 checkIfSelected: '+woNum+':', selectedOption, assignedToUserId, mobStatusId, this.currUserId);
        
    return (selectedOption == "0" || 
    //(selectedOption == "2" && mobStatusId == 2 && assignedToUserId == -1) || 
    (selectedOption == "2" && mobStatusId == 2) || 
    (selectedOption == "1" && mobStatusId !== 2 && this.currUserId == assignedToUserId ));
  }
  createWO() {
    if (!this.pressedChangeStatusBtn) {
      if (this.masterTableDataSvc.isWoCreateAllowed() )
        this.navCtrl.navigateForward('/tabs/sel-workorder/workorder-add)');
      else
        alert('You are not allowed to edit a work order');
    }
  }
  
  ionViewWillLeave() {
    if (this.firstTimeLeaving) {
      //console.log('**REMOVE - ionViewWillLeave selWorkorder --> firstTimeLeaving');
      this.firstTimeLeaving = false;
      //this.masterTableDataSvc.loadMissingSmallMTs();
    }
  }

  refreshFromServer() {
    this.connectionSvc.isConnected2Server(6000)
    .then (()=> {
      console.log('*** 01 ****');
      this.workorderDataSvc.setForceResyncWos(); // this only sets a flag
      this.workorderDataSvc.getAllWorkorders()
      .then ((data) => {
        if (this.utilitiesSvc.debugIssue('1906-20')) console.log('refreshFromServer(): setting this.workorderList to returned <data>');
        this.workorderList = <WorkorderModel[]>data
      }); 
    });
    /*
    if (this.httpRequestsSvc.connected2Server) {
      this.workorderDataSvc.setForceResyncWos();
      this.workorderDataSvc.getAllWorkorders()
      .then ((data) => this.workorderList = <WorkorderModel[]>data);      
    }
    */
  }

  ionViewDidEnter() {
    this.currUserId = this.applicVarsSvc.getLoginUserId();
    this.masterTableDataSvc.loadWoSecArrays();     
    //console.log('DID ENTER SelWorkorderPage! initial entery / device is online', this.initialEntry, this.httpRequestsSvc.connected2Server);

    if (!this.httpRequestsSvc.connected2Server) { // no connection to server
      console.log('*** 02 ****');
      this.workorderDataSvc.getWorkordersFromLS()
      .then ((data) => this.workorderList = <WorkorderModel[]>data);
    }
    else    
    if (this.initialEntry || this.workorderDataSvc.need2SelectWos) {
      console.log('*** 03 ****');
      this.workorderDataSvc.need2SelectWos = false;
      this.initialEntry = false;
      this.refreshFromServer();     
    }
    
  }
  
  ngOnInit() {
    this.PageTitle = 'Select Workorder'; 
    this.workstatus = "1"; 
  }

}