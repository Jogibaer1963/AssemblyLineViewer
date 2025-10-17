import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { App } from './app';


@NgModule({
  declarations: [App],
  imports: [BrowserModule, FormsModule, HttpClientModule],
  bootstrap: [App]
})
export class AppModule {}
