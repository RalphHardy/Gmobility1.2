import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TabsPageRoutingModule } from '../tabs/tabs.router.module'

import { LoginPage } from './login.page';
import { SiteCodePage } from '../admin/site-code/site-code.page';

import { ComponentsModule } from '../../components/components.module';

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [LoginPage, SiteCodePage], 
  entryComponents: [SiteCodePage]
})
export class LoginPageModule {}

/*
https://stackoverflow.com/questions/51778258/ionic-4-using-modals-via-the-modalcontroller
@NgModule({ imports: [ CommonModule, FormsModule, 
  IonicModule, RouterModule.forChild(routes)], declarations: [MyPage, MyModalPage], entryComponents: [MyModalPage] })
*/