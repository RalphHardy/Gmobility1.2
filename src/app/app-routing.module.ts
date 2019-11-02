/*
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'sel-workorder', loadChildren: './pages/sel-workorder/sel-workorder.module#SelWorkorderPageModule' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WoNotesPage } from './pages/workorders/wo-notes/wo-notes/wo-notes.page';
import { WoNoteEditPage } from './pages/workorders/wo-notes/wo-note-edit/wo-note-edit.page';
import { WoAttachPage } from './pages/workorders/wo-attach/wo-attach.page';

const sidemenuRoutes: Routes = [
  { path: '', loadChildren: './pages/tabs/tabs.module#TabsPageModule' },
  { path: 'notes', 
    component: WoNotesPage,
    //loadChildren: './pages/workorders/wo-notes/wo-notes/wo-notes.module#WoNotesPageModule',
      children: [{path: 'notes/note-edit/:wonum/:type/:line', 
      //outlet: 'notes',
      component: WoNoteEditPage
        //loadChildren: './pages/workorders/wo-notes/wo-note-edit/wo-note-edit.module#WoNoteEditPageModule'
      }
      ] },
  { path: 'attachments', 
    component: WoAttachPage
    //loadChildren: './pages/admin/settings/settings.module#SettingsPageModule'
  },
  { path: 'settings', loadChildren: './pages/admin/settings/settings.module#SettingsPageModule' }
];
/*
const appRoutes: Routes = [
  { path: '', loadChildren: './pages/tabs/tabs.module#TabsPageModule' }
];
*/
@NgModule({
  imports: [RouterModule.forRoot(sidemenuRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
