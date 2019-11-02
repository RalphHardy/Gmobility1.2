import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { UnderConstructionPage } from './under-construction.page';

const routes: Routes = [
  {
    path: '',
    component: UnderConstructionPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UnderConstructionPage]
})
export class UnderConstructionPageModule {}
