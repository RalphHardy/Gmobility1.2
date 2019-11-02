import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

/* My App additions... */
import { ReactiveFormsModule } from '@angular/forms';

/* PWA Components */
import { ComponentsModule } from '../../../components/components.module';

/* Pages */

import { WoDatesPage } from '../wo-dates/wo-dates.page';
import { WorkorderEditPage } from './workorder-edit.page';

const routes: Routes = [
  {
    path: '',
    component: WorkorderEditPage
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
  declarations: [WorkorderEditPage, WoDatesPage],
  entryComponents: [WoDatesPage]
})
export class WorkorderEditPageModule {}
