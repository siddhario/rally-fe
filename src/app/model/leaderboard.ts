export interface Leaderboard {
  position: number;
  vehicleId: number;
  teamName: string;
  model: string;
  elapsedTime: Date;
  finishTime: Date;
  status: string;
  distance:number;
  type:string;
  percentage:number;
  mfts:Date;
  lmfts:Date;
  repairmentTime:Date;
  totalRepairmentTime:Date;
  raceTime:Date;
}