import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, MenuController, NavController, ModalController, AlertController } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../../services/utilities.svc';
import { ConnectionSvc } from '../../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../../services/workorder-data.svc';

//Models
import { WorkorderModel } from '../../../../models/workorder-model';
import { WoNoteModel } from '../../../../models/wo-note-model';

//Plugins

//Pages
import { WoNoteEditPage } from '../wo-note-edit/wo-note-edit.page';

//Data
import { environment } from '../../../../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-wo-notes',
  templateUrl: './wo-notes.page.html',
  styleUrls: ['./wo-notes.page.scss'],
})
export class WoNotesPage implements OnInit {

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc,
    private workorderDataSvc: WorkorderDataSvc
  ) { }
  
  //component data
  private PageTitle = 'Notes';
  private woNum: string = '';

  // processing data
  private initialEntry = true;
  private currWO: WorkorderModel;
  private allowEdit = true;

  //private noteEditPage = WoNoteEditPage;
  private workstatus = "1";
  private currWoNum = '';
  private currUserId: number;
  private selectNoteType: string = 'W';
  //private noteTypes: string = "E012WLMA";
  //private dispNoteTypes: string = " EWWWWLMA"; // have to +1 to index of noteTypes (" " for anything that doesn't map)

	private currNotes: string;

  /*
  onEditNote(lineId: number, recType: string) {
    this.navCtrl.navigateForward('notes/note-edit/'+this.currWoNum+'/'+recType+'/'+lineId.toString());
  }
  */

  async onEditNote(lineId: number, recType: string) {
    if (this.allowEdit) {
      var data = { wonum : this.currWoNum, type: recType, line: lineId };
      const modalPage = await this.modalCtrl.create({
        component: WoNoteEditPage, 
        componentProps:{values: data}
      });
  
      modalPage.onDidDismiss()
        .then ((rtnValue:any) => {
          console.log('Returned from WoNoteEditPage:', rtnValue);
          if (rtnValue) {
           
          }
        });
      return await modalPage.present();
    }
  } 
  
  goBack() {
    const url=this.connectionSvc.getParentRoot();
  
    this.navCtrl.navigateBack("/tabs/sel-workorder");
  }

  //mapNoteRecLinkType(ch: string): string {
    //if (ch=="") ch = " ";
    //const mapIdx = this.noteTypes.indexOf(ch)+1;
    //return this.dispNoteTypes[mapIdx];
  //}

  ionViewWillEnter() {
    if (!this.initialEntry) {
      this.utilitiesSvc.debugAlert(false, 'ionViewDidEnter', 'Not initialEntry');
      this.currWO = this.workorderDataSvc.getCurrWO();
      this.allowEdit = this.currWO.WoMobStatusId < 4;
      this.currWoNum = this.currWO.WoNumber;
      console.log('currWO =>', this.currWO);
      this.PageTitle = 'WO '+this.currWoNum+' Notes';
    }
  }

  ngOnInit() {
    console.log('W/O NOTES: this.route =>', this.connectionSvc.getParentRoot() );
    this.currWO = this.workorderDataSvc.getCurrWO();
    this.allowEdit = this.currWO.WoMobStatusId < 4;
    this.currWoNum = this.currWO.WoNumber;
    console.log('currWO =>', this.currWO);
    this.PageTitle = 'WO '+this.currWoNum+' Notes';
  }

}
/*
<ion-content>
    <ion-card color=subhead-bkgd>
    <ion-grid fixed>
      <ion-row>
        <ion-col size="12">
         
            <ion-select [(ngModel)]="selectNoteType" color=subhead-bkgd 
            class="full-width-select">
              <ion-select-option value="*" >All Notes</ion-select-option>
              <ion-select-option value="E" >S/C/A Notes</ion-select-option>
              <ion-select-option value="W" >Mobile Notes for W/O</ion-select-option>
              <ion-select-option value="L" >Mobile Notes for Labor</ion-select-option>
              <ion-select-option value="M" >Mobile Notes for Material</ion-select-option>
              <ion-select-option value="A" >Mobile Notes for Attachments</ion-select-option>
            </ion-select>
      
        </ion-col>
  
      </ion-row>
    </ion-grid>
  </ion-card>

  <ion-list>
    <ion-item  *ngFor="let note of currWO.WoNotes; let noteIdx = index"
       [color]="note.NotePriority ? 'btn-active' : 'btn-white' "     
      text-wrap (click)="onEditNote(note.MobLineId, note.NoteLinkedToRecType)">
        <ion-grid fixed>        
        <ion-row>
          <!--<ion-item style="padding: 0px; margin: 0px; "-->
            <ion-col size="3">
                <span style="padding: 0px; margin: 0px; "><b>Note:</b> {{ note.MobLineId }}</span>
            </ion-col>

            <ion-col size="8">
                <span style="padding: 0px; margin: 0px; "> {{ note.NoteTags }}</span>
            </ion-col>

            <ion-col size="1">
                <span style="padding: 0px; margin: 0px; "> [{{ mapNoteRecLinkType(note.NoteLinkedToRecType) }}]</span>
            </ion-col>
          </ion-row>

        <ion-row class="row-info" align-items-center>
          <div class="desc-style">{{ note.NoteText }} </div>
        </ion-row>   
      </ion-grid>
        
    </ion-item >
  </ion-list>  

</ion-content>
*/
