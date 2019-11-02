import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs.router.module';

import { TabsPage } from './tabs.page';

import { LoginPageModule } from '../login/login.module';
import { SelWorkorderPageModule } from '../workorders/sel-workorder/sel-workorder.module';
import { WorkorderPageModule } from '../workorders/workorder/workorder.module';
import { WorkorderCreatePageModule } from '../workorders/workorder-create/workorder-create.module';
import { WorkorderEditPageModule } from '../workorders/workorder-edit/workorder-edit.module';
import { WoLaborEditPageModule } from '../../pages/workorders/wo-labor-edit/wo-labor-edit.module';
import { TimecardsPageModule } from '../../pages/workorders/timecards/timecards.module';
import { TimecardEditPageModule } from '../../pages/workorders/timecard-edit/timecard-edit.module';
import { WoMaterialEditPageModule } from '../../pages/workorders/wo-material-edit/wo-material-edit.module';

import { WoNoteEditPageModule } from '../../pages/workorders/wo-notes/wo-note-edit/wo-note-edit.module';
import { WoNotesPageModule } from '../../pages/workorders/wo-notes/wo-notes/wo-notes.module';
import { WoAttachPageModule } from '../../pages/workorders/wo-attach/wo-attach.module';

import { WorkRequestsPageModule } from '../../pages/workorders/work-req/work-requests/work-requests.module';
import { WorkReqPageModule } from '../../pages/workorders/work-req/work-req/work-req.module';

import { SettingsPageModule } from '../../pages/admin/settings/settings.module';

import { ResetLsoPageModule } from '../../pages/maint/reset-lso/reset-lso.module';
import { DisplayLsoPageModule } from '../../pages/maint/display-lso/display-lso.module';


import { UtilitiesSvc } from '../../services/utilities.svc';
import { ConnectionSvc } from '../../services/connection.svc';
import { ApplicVarsSvc } from '../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../services/workorder-data.svc';

import { LoginGuardSvc } from '../../pages/tabs/login-guard.svc';
import { LoginGuardDeactivateSvc } from '../../pages/tabs/login-guard-deactivate.svc';
import { LsoRequestsService } from '../../services/lso-requests.service';
import { SelSkucodePageModule } from '../../pages/selectforms/sel-skucode/sel-skucode.module';

import { LoadingService } from '../../services/loading.service';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    LoginPageModule,
    SelWorkorderPageModule,
    WorkorderPageModule,
    WorkorderCreatePageModule,
    WorkorderEditPageModule,
    WoLaborEditPageModule,
    TimecardsPageModule,
    TimecardEditPageModule,
    WoMaterialEditPageModule,
    WoNotesPageModule,
    WoNoteEditPageModule,
    WoAttachPageModule,
    WorkRequestsPageModule,
    WorkReqPageModule,
    ResetLsoPageModule,
    DisplayLsoPageModule,
    SelSkucodePageModule
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}