import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableAkitaProdMode, persistState } from '@datorama/akita';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { akitaConfig } from "@datorama/akita";

akitaConfig({
  resettable: true
});

//const el = document.getElementById("base")
//el.setAttribute(`href`,environment.base)

console.clear();

if (environment.production) {
  enableProdMode();
  window.console.log = () => { }
}
try{
  persistState();
}catch(e){

}



platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
