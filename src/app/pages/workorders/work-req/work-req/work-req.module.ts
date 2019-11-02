import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

/* My App additions... */
import { ReactiveFormsModule } from '@angular/forms';

/* PWA Components */
import { ComponentsModule } from '../../../../components/components.module';

import { WorkReqPage } from './work-req.page';

const routes: Routes = [
  {
    path: '',
    component: WorkReqPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WorkReqPage]
})
export class WorkReqPageModule {}
