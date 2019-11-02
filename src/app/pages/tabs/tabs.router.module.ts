import { NgModule } from '@angular/core';
import { CanActivate, CanDeactivate, RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';
import { LoginPage } from '../../pages/login/login.page';
import { SelWorkorderPage } from '../../pages/workorders/sel-workorder/sel-workorder.page';
import { WorkorderPage } from '../../pages/workorders/workorder/workorder.page';
import { WorkorderCreatePage } from '../../pages/workorders/workorder-create/workorder-create.page';
import { WorkorderEditPage } from '../../pages/workorders/workorder-edit/workorder-edit.page';
import { WoLaborEditPage } from '../../pages/workorders/wo-labor-edit/wo-labor-edit.page';
import { TimecardsPage } from '../../pages/workorders/timecards/timecards.page';
import { TimecardEditPage } from '../../pages/workorders/timecard-edit/timecard-edit.page';
import { WoMaterialEditPage } from '../../pages/workorders/wo-material-edit/wo-material-edit.page';
import { WoNotesPage } from '../../pages/workorders/wo-notes/wo-notes/wo-notes.page';
import { WoNoteEditPage } from '../../pages/workorders/wo-notes/wo-note-edit/wo-note-edit.page';
import { WoAttachPage } from '../../pages/workorders/wo-attach/wo-attach.page';

import { DisplayLsoPage } from '../../pages/maint/display-lso/display-lso.page';
import { ResetLsoPage } from '../../pages/maint/reset-lso/reset-lso.page';

import { LoginGuardSvc } from './login-guard.svc';
import { CanDeactivateGuard } from './login-guard-deactivate.svc';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: '/tabs/(login:login)',
        pathMatch: 'full',
      },
      {
        path: 'login',
        children: [
          {
            path: '',
            //component: LoginPage
            loadChildren: '../login/login.module#LoginPageModule'
          }
        ]
      },
      {
        path: 'login/display-lso',
        children: [
          {
            path: '',
            //component: 
            loadChildren: '../maint/display-lso/display-lso.module#DisplayLsoPageModule'
          }
        ]
      },
      {
        path: 'login/reset-lso',
        children: [
          {
            path: '',
            //component: 
            loadChildren: '../maint/reset-lso/reset-lso.module#ResetLsoPageModule'
          }
        ]
      },
      {
        path: 'settings',
       canActivate: [LoginGuardSvc],
        children: [
          {
            path: '',
            //component: 
            loadChildren: '../admin/settings/settings.module#SettingsPageModule'
          }
        ]
      },
      {
        path: 'work-requests',
        canActivate: [LoginGuardSvc],
        children: [
          {
            path: '',
            loadChildren: '../workorders/work-req/work-requests/work-requests.module#WorkRequestsPageModule'
          }
        ]
      },
      {
        path: 'work-requests/work-req/:idx', 
        children: [
          {
            path: '',
            // component: WorkorderPage
            loadChildren: '../workorders/work-req/work-req/work-req.module#WorkReqPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder',
        canActivate: [LoginGuardSvc],
        children: [
          {
            path: '',
            //component: SelWorkorderPage
            loadChildren: '../workorders/sel-workorder/sel-workorder.module#SelWorkorderPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/workorder-add',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            // component: WorkorderPage
            loadChildren: '../workorders/workorder-create/workorder-create.module#WorkorderCreatePageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/workorder/:wonum',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            // component: WorkorderPage
            loadChildren: '../workorders/workorder/workorder.module#WorkorderPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/workorder-edit/:wonum',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/workorder-edit/workorder-edit.module#WorkorderEditPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/wo-labor-edit/:wonum/:line',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/wo-labor-edit/wo-labor-edit.module#WoLaborEditPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/timecards/:wonum/:line',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/timecards/timecards.module#TimecardsPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/timecard-edit/:wonum/:line/:tcline',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/timecard-edit/timecard-edit.module#TimecardEditPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/wo-material-edit/:wonum/:line',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/wo-material-edit/wo-material-edit.module#WoMaterialEditPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/notes/:wonum',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/wo-notes/wo-notes/wo-notes.module#WoNotesPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/notes/note-edit/:wonum/:type/:line',
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/wo-notes/wo-note-edit/wo-note-edit.module#WoNoteEditPageModule'
          }
        ]
      },
      {
        path: 'sel-workorder/attachments/:wonum',
        canActivate: [LoginGuardSvc],
        children: [
          {
            path: '',
            canActivate: [LoginGuardSvc],
            loadChildren: '../workorders/wo-attach/wo-attach.module#WoAttachPageModule'
          }
        ]
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {
}
