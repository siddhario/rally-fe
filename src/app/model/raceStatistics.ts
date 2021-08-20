export interface RaceStatistics {
    raceStatus: string;
    vehicleStatus: VehicleStatus;
    vehicleTypes: VehicleType;
    raceTime: Date;

}

export interface VehicleStatus {
    pending: number;
    racing: number;
    repairing: number;
    malfunction: number;
    finished: number;
}
export interface VehicleType {
    sportCars: number;
    terrainCars: number;
    trucks: number;
    sportMotos: number;
    crossMotos: number;
}