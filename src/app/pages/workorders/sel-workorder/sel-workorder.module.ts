import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

/* PWA Components */
import { ComponentsModule } from '../../../components/components.module';

/* Pages */
import { SelWorkorderPage } from './sel-workorder.page';
import { WostatusPage } from '../wostatus/wostatus.page';

const routes: Routes = [
  {
    path: '',
    component: SelWorkorderPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SelWorkorderPage, WostatusPage],
  entryComponents: [WostatusPage]
})
export class SelWorkorderPageModule {}
