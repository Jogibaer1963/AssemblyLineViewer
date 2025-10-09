import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { App } from './app';


@NgModule({
  declarations: [App],
  imports: [BrowserModule, FormsModule],
  bootstrap: [App]
})
export class AppModule {}
