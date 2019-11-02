import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidemenuComponent } from './sidemenu/sidemenu.component';
import { MenuNoSideComponent } from './menu-no-side/menu-no-side.component';
import { FormSubmitButtonsComponent } from './form-submit-buttons/form-submit-buttons.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [SidemenuComponent, MenuNoSideComponent, FormSubmitButtonsComponent],
  exports: [SidemenuComponent, MenuNoSideComponent, FormSubmitButtonsComponent]
})
export class ComponentsModule { }
