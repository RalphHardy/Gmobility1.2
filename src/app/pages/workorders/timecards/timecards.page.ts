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
import { WoLaborLineModel } from '../../../models/wo-labor-line-model';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;


@Component({
  selector: 'app-timecards',
  templateUrl: './timecards.page.html',
  styleUrls: ['./timecards.page.scss']
})
export class TimecardsPage implements OnInit {
  //component data
  private PageTitle: string = '';

  //presentation data
  private currWoNum = '';
  private currLLid = 0;
  private laborDesc = '';

  //processing data
  private currWO: WorkorderModel;
  private currLL: WoLaborLineModel = this.workorderDataSvc.blankLaborLine;
  private initialEntry = true;
  private allowAdd: boolean = true;

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


  onAddEditTimeCard(tcLineId: number) {
    this.navCtrl.navigateForward('tabs/sel-workorder/timecard-edit/'+this.currWoNum+'/'+ this.currLLid.toString()+'/'+tcLineId.toString());
  }

  ionViewDidEnter() {
    console.log('DID ENTER WorkorderPage!');
    if (this.initialEntry) {
      this.initialEntry = false;
    }
    else
    {
      this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
    }
    this.allowAdd = this.currWO.WoMobStatusId < 4;
  }
 

  getIdxLL(lineId: number): number {
    const lastIdx = this.currWO.WoLaborLines.length;
    //console.log('lastIdx', lastIdx);
    for (var i = 0; i < lastIdx; i++) {
      console.log('compare: ',i, lineId, this.currWO.WoLaborLines[i].MobLineId );
      if (this.currWO.WoLaborLines[i].MobLineId == lineId) {
        console.log('MATCHED: ',i, lineId, this.currWO.WoLaborLines[i].MobLineId );
        return i;
      }
    }
    return -1;
  }
  
  ngOnInit() {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.currWoNum = params['wonum'];
          this.currWO = this.workorderDataSvc.getWorkorder(this.currWoNum);
          this.currLLid = params['line'];
          this.PageTitle = 'Timecards '+this.currWoNum+' ('+this.currLLid.toString()+')';
          const idxLL = 
            this.workorderDataSvc.getIdxFromMobLineId(this.currLLid, this.currWO.WoLaborLines);
          console.log('Params =>', params, 'LL Idx =>', idxLL);       
          this.currLL = this.currWO.WoLaborLines[idxLL];
          if (this.currLL.Description != '') this.laborDesc = this.currLL.Description
          else this.laborDesc = this.currWO.WoDesc;
          console.log('currLL =>', this.currLL, 'laborDesc=>', this.laborDesc);          
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

