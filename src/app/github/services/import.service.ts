import { HttpClient } from '@angular/common/http'
import { Injectable, Inject } from '@angular/core'
import { NgxSpinnerService } from 'ngx-spinner'
import { ToastrService } from 'ngx-toastr'
import { environment } from 'src/environments/environment'
import { v4 as uuid } from 'uuid'
import { github, scriptrunnerCommand } from '../+state'
import { GitHubQuery } from '../+state/github.query'
import { GitHubStore } from '../+state/github.store'
import { Workshop, WorkshopQuery, WorkshopState, WorkshopStore } from '../../workshop/+state'
import { REMIX, RemixClient } from 'src/app/remix-client'
import { WorkshopserviceService } from 'src/app/workshop/services/workshop.service'
import { Route } from '@angular/compiler/src/core'
import { Router } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import axios from 'axios'

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  
  constructor(
    private githubquery: GitHubQuery,
    private githubstore: GitHubStore,
    private http: HttpClient,
    private workshopstore: WorkshopStore,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private workshopService: WorkshopserviceService,
    private workshopQuery:WorkshopQuery,
    private router:Router,
    @Inject(REMIX) private remix: RemixClient
  ) {
    this.remix.loadRepoObservable.subscribe( data =>{
      console.log("loading repo in service",data.name);
      if(data.name != "")
      this.loadcontent(data).then(()=>console.log("repo loaded"));
      this.router.navigate(['/workshops'])
    });
    this.remix.startTutorialObservable.subscribe( data =>{
      console.log("loading repo in service",data.name);
      if(data.name != "")
      this.loadcontent(data).then(()=>
        {
          console.log("repo loaded, get tutorial", data.id)
          this.startTutorial(data);
        });
    });
  }

  async loadcontent(github: github) {
   
    const message = `${github.name}/${github.branch}`
    const githubname = encodeURIComponent(github.name)
    const url =
      `${environment.apiUrl}clone/${githubname}/${github.branch}?` +
      Math.random()
    this.spinner.show()
    const tid = this.toastr.info(`loading ${message}`, `loading`, {
      timeOut: 0
    }).toastId

    console.log("loading ",url, this.remix);
    let error: string
    try {
      await this.remix.onload()
      await axios.get(url)
        .then(content => {
          error = content.data
          const initialState: Partial<WorkshopState> = content.data
          github = {
            ...github,
            datemodified: initialState.datemodified,
            data: initialState
          }
          console.log("loaded ",url, initialState)
          //this.workshopService.resetWorksShopsLoaded()
          this.workshopstore.set(initialState)
          this.toastr.remove(tid)
          this.spinner.hide()
          this.addGitHubToStore(github)
        })
        .catch(Error => {
          this.spinner.hide()
          this.toastr.remove(tid)
          this.toastr.error(`loading failed: ${error}`, `error loading`, {
            timeOut: 0
          })
        })
    } catch (err) {
      this.spinner.hide()
      this.toastr.remove(tid)
      this.toastr.error(`loading failed`, `error loading`, {
        timeOut: 0
      })
    }
  }

  addGitHubToStore(github: github) {
    let searchitem: Array<github>
    
    this.githubquery.selectAll().subscribe(githubs => {
      searchitem = githubs.filter(
        item => item.name == github.name && item.branch == github.branch
      )
    })

    if (searchitem.length == 0) {
      github = { ...github, id: uuid() }
    }
    this.githubstore.upsert(github.id, { ...github })
    this.githubstore.setActive(github.id)
    this.githubquery.setUIisClosed(github.id)
  }

  startTutorial(command:scriptrunnerCommand){
    console.log("startTutorial", command);
    this.workshopQuery.selectAll().subscribe((workshops)=>{
        workshops.map((workshop,index)=>{
          if(typeof command.id == "number"){
            if(index+1 == command.id){
              console.log("start it",workshop)
              this.router.navigate(['/workshops', workshop.id])
            }
          }else{
          if(workshop.metadata){
            if(workshop.metadata.data.id == command.id){
              console.log("start it",workshop.metadata.data.id)
              this.router.navigate(['/workshops', workshop.id])
            }
          }
        }
        })
      
    }).unsubscribe()
  }
}
