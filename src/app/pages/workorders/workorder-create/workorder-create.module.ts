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
import { WorkorderCreatePage } from './workorder-create.page';
import { SelEmployeePage } from '../../selectforms/sel-employee/sel-employee.page';
import { SelEquipmentPage } from '../../selectforms/sel-equipment/sel-equipment.page';

const routes: Routes = [
  {
    path: '',
    component: WorkorderCreatePage
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
  declarations: [WorkorderCreatePage, SelEquipmentPage, SelEmployeePage], //], 
  entryComponents: [SelEquipmentPage, SelEmployeePage] // 
})
export class WorkorderCreatePageModule {}
