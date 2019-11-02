import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MenuController, NavController, ActionSheetController } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../models/workorder-model';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-workorder',
  templateUrl: './workorder.page.html',
  styleUrls: ['./workorder.page.scss']
})

export class WorkorderPage implements OnInit {
  //component data
  private PageTitle: string = '';

  //presentation data
  private currWoNum = '';

  //processing data
  private currWO: WorkorderModel = this.workorderDataSvc.createWorkorderObject();
  private initialEntry = true;
  private changeAllowed: boolean = true;
  private woStatus = 99;
  

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController, 
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc
  ) { }


  onEditWo(lineId:number) {
    //  href="tabs/sel-workorder/workorder/{{WO.WoNumber}})" 
    this.navCtrl.navigateForward('tabs/sel-workorder/workorder-edit/'+
      this.currWoNum);
  } 

  onAddEditLaborLine(lineId: number) { //'tabs/sel-workorder/wo-labor-edit/GN10806/1'
    console.log('onAddEditLaborLine');
    if (!this.currWO.UrgentFlag && this.changeAllowed) this.navCtrl.navigateForward('tabs/sel-workorder/wo-labor-edit/'+this.currWoNum+'/'+lineId);
  }

  onClickTimecards(lineId:number) {
    //  href="tabs/sel-workorder/workorder/{{WO.WoNumber}})" 
    if (!this.currWO.UrgentFlag && this.changeAllowed)
      this.navCtrl.navigateForward('tabs/sel-workorder/timecards/'+this.currWoNum+'/'+lineId.toString());
      else
        alert('You are not allowed to edit a work order');
  }
  onAddEditMaterialLine(lineId: number) {
    console.log('onAddEditMaterialLine');
    if (!this.currWO.UrgentFlag && this.changeAllowed) this.navCtrl.navigateForward('tabs/sel-workorder/wo-material-edit/'+this.currWoNum+'/'+lineId);
  }

  ionViewDidEnter() { 
    console.log('DID ENTER WorkorderPage! this.route =>', this.router);

    this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    if (this.initialEntry) {
      this.initialEntry = false;
      const currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
      this.woStatus = currWO.WoMobStatusId;
      this.changeAllowed = ( this.workorderDataSvc.ok2EditWo(this.woStatus)
                            && this.masterTableDataSvc.isWoEditAllowed());
    }
    console.log('wonum->', this.currWoNum, this.currWO);
  }
 

  ngOnInit() {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.PageTitle = 'WO Details '+this.currWoNum;
        },
        (err) => {

        },
        () => {

        }
      )
  }

  async selectMenuItem() {
    const actionSheet = await this.actionSheetController.create({
        buttons: [{
                text: 'Notes ('+this.currWO.WoNotes.length+')',
                handler: () => {
                  this.workorderDataSvc.setCurrWo(this.currWoNum);
                  this.navCtrl.navigateForward('tabs/sel-workorder/notes/'+ this.currWoNum);
                }
            },
            {
                text: 'Attachments ('+this.currWO.WoAttachFiles.length+')',
                handler: () => {
                  this.workorderDataSvc.setCurrWo(this.currWoNum);
                  this.navCtrl.navigateForward('tabs/sel-workorder/attachments/'+ this.currWoNum);
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
