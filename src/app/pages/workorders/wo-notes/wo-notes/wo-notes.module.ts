import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WoNotesPage } from './wo-notes.page';
//import { WoNoteEditPage } from '../wo-note-edit/wo-note-edit.page';
//import { WoNoteEditPageModule } from '../wo-note-edit/wo-note-edit.module';

const routes: Routes = [
  {
    path: '',
    component: WoNotesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WoNotesPage]
})
export class WoNotesPageModule {}
