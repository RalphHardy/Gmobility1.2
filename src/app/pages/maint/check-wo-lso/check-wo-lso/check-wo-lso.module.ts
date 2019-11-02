import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CheckWoLsoPage } from './check-wo-lso.page';

const routes: Routes = [
  {
    path: '',
    component: CheckWoLsoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CheckWoLsoPage]
})
export class CheckWoLsoPageModule {}
