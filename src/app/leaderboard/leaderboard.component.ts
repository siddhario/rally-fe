import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Leaderboard } from '../model/leaderboard';
import { switchMap, tap, share, retry, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject, timer } from 'rxjs';
import * as prettyMilliseconds from 'pretty-ms';
import { Race } from '../model/race';
import { ThrowStmt } from '@angular/compiler';
import { ToastrService } from 'ngx-toastr';
import { RaceStatistics, VehicleStatus } from '../model/raceStatistics';
@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnDestroy {

  leaderboard$: Observable<Leaderboard[]>;
  private stopPolling = new Subject();

  vehicleType: any = "-1";

  raceId: number;
  pending:number;
  running:number;
  malfunction:number;
  repairing:number;
  finished:number;

  races$: Observable<Race[]>;
  raceStatistics$: Observable<RaceStatistics>;
  teamName: string;
  model: string;
  manufacturingDate: Date;
  newVehicleType: number = 2;
  percentage: boolean = false;


  year: number = 2021;
  gameSpeed: number=3000;
  length: number=10000000;
  loadLeaderboard: boolean = false;

  vehiclesPerType: number = 2;

  constructor(private http: HttpClient, private toastr: ToastrService) {

    /*   this.http.get<Leaderboard[]>("/race/leaderboard?raceId=" + this.raceId).subscribe(r => {
  
        this.leaderboard$ = of(r);
      }) */

     
    this.loadRaces();
  }

  loadRaces() {
    this.http.get<Race[]>("/race").subscribe(r => {
      this.races$ = of(r);
      if (r.length > 0)
        this.select(r[r.length - 1].id);
      this.loadRaceStats();
    })
  }
  createGame() {
    this.http.post("/race/create?year=" + this.year,
      { length: this.length, gameSpeed: this.gameSpeed }).subscribe(r => {
        this.loadRaces();
      },
        error => {
          this.toastr.error(error.error);
        });
  }

  getClass(status: string) {
    if (status == "HEAVY_MALFUNCTION")
      return "table-danger"
    else if (status == "REPAIRING")
      return "table-warning";
    else if (status == "PENDING")
      return "";
    else if (status == "RACING")
      return "table-primary";
    else if (status == "FINISHED")
      return "table-success";
  }

  addVehicle() {
    this.http.post("/Vehicle/add?raceId=" + this.raceId,
      { teamName: this.teamName, model: this.model, manufacturingDate: this.manufacturingDate, vehicleTypeId: this.newVehicleType })
      .subscribe(r => {
        this.load();
        this.toastr.success('Vehicle added!');
      },
        error => {
          this.toastr.error(error.error);
        });
  }

  pretty(miliseconds: number) {
    return prettyMilliseconds(miliseconds, { colonNotation: true });
  }
  round(num: number, decimals: number) {
    return Math.round(num);
  }

  formatTime(item: any) {
    return !item ? "" : item.days + ":" + item.hours.toString().padStart(2, '0') + "h:" + item.minutes.toString().padStart(2, '0') + "m:" + item.seconds.toString().padStart(2, '0') + "s." + item.milliseconds.toString().padStart(3, '0');
  }

  interval;
  intervalRaceStats;
  ngOnDestroy() {
    this.stopPolling.next();
    clearInterval(this.interval);
    clearInterval(this.intervalRaceStats);
  }

  select(raceId: number) {
    this.raceId = raceId;
    this.load();
    this.loadRaceStats();
  }

  editRace: Race;
  cancelUpdateGame() {
    this.editRace = null;
  }
  edit(item: Race) {
    this.editRace = item;
    this.year = item.year;
    this.gameSpeed = item.gameSpeed;
    this.length = item.length;
  }

  updateGame() {
    this.http.put("/race/update?raceId=" + this.raceId,
      { length: this.length, gameSpeed: this.gameSpeed, year: this.year }).subscribe(r => {
        this.load();
        this.loadRaces();
        this.year = 2021;
        this.gameSpeed=1;
        this.length = 140000;
        this.editRace=null;
        this.toastr.success("Race updated");
      },
        error => {
          this.toastr.error(error.error);
        });
  }
  initData() {
    this.http.post("/Vehicle/initData?raceId=" + this.raceId + "&vehiclesPerType=" + this.vehiclesPerType,
      {}).subscribe(r => {
        this.load();
      },
        error => {
          this.toastr.error(error.error);
        });
  }



  remove(vehicleId) {
    this.http.delete("/Vehicle/delete?vehicleId=" + vehicleId,
      {}).subscribe(r => {
        this.load();
        this.toastr.success("Vehicle removed!");
      },
      error => {
        this.toastr.error(error.error);
      });
  }

  clear() {
    this.http.delete("/race/clear",
      {}).subscribe(r => {
        this.load();
      });
  }


  startLoading() {
    this.leaderboard$ = timer(1, 300).pipe(
      switchMap(() => this.http.get<Leaderboard[]>("/race/leaderboard?raceId=" + this.raceId + (this.vehicleType == "-1" ? "" : "&vehicleTypeId=" + this.vehicleType))),
      retry(),
      share(),
      takeUntil(this.stopPolling)
    );

    this.raceStatistics$ = timer(1, 300).pipe(
      switchMap(() => this.http.get<RaceStatistics>("/race/statistics?raceId=" + this.raceId)),
      retry(),
      share(),
      takeUntil(this.stopPolling)
      ,tap((r) => {  
    
      }
      )
    )
  }

  vehicleStatus:VehicleStatus[];
  start() {


    this.http.post("/race/start?raceId=" + this.raceId, {}).subscribe(r => {
      this.toastr.success("Race started!");
      this.startLoading();
    }, error => {
      this.toastr.error(error.error);
    });




    // this.http.post("/race/start?raceId=" + this.raceId, {}).subscribe(r => {
    //   this.toastr.success("Race started!");
    //   this.interval = setInterval(() => {
    //     if (this.loading == true)
    //     this.leaderboard$ =  this.load();
    //   }, 500);

    //   this.intervalRaceStats = setInterval(() => {
    //     if (this.loading == true)
    //       this.loadRaceStats();
    //   }, 500);
    // }
    //   ,
    //   );

  }

  getStatusClass(status: string) {
    if (status == "RUNNING")
      return "btn btn-outline-success btn-sm";
    else if (status == "PENDING")
      return "btn btn-outline-primary btn-sm";
    else
      return "btn btn-success btn-sm";
  }

  load() {
    this.http.get<Leaderboard[]>("/race/leaderboard?raceId=" + this.raceId + (this.vehicleType == "-1" ? "" : "&vehicleTypeId=" + this.vehicleType)).subscribe(r => { this.leaderboard$ = of(r); });

  }

  loadRaceStats() {
    this.http.get<RaceStatistics>("/race/statistics?raceId=" + this.raceId).subscribe(r => {
      this.raceStatistics$ = of(r);
      if (r.raceStatus == "RUNNING")
        this.startLoading();
    })

  }
  loading = false;
  stop() {
    this.http.post<Leaderboard[]>("/race/stop?raceId=" + this.raceId, {}).subscribe(r => {
      this.load();
      this.loadRaceStats();
      this.loading = false;
    });
  }

}
