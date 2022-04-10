import { ServerPlayer } from "./Player";
  
  export default class Vehicle {
    public location?: VehicleLocation;

    public passengers?: Passenger[];
  
    private readonly _id: string;
  
    private readonly _vehicleType: string;

    private readonly _capacity: number;

    private readonly _speed: number;
  
    public sprite?: Phaser.GameObjects.Sprite;
  
    constructor(id: string, vehicleType: string, capacity: number, speed: number, location: VehicleLocation, passengers: Passenger[]) {
      this._id = id;
      this._vehicleType = vehicleType;
      this._capacity = capacity;
      this._speed = speed;
      this.location = location;
      this.passengers = passengers;
    }
  
    get id(): string {
      return this._id;
    }

    get vehicleType(): string{
        return this._vehicleType;
    }

    get capacity(): number{
        return this._capacity;
    }

    get speed(): number{
        return this._speed;
    }
  
    static fromServerVehicle(vehicleFromServer: ServerVehicle): Vehicle {
      return new Vehicle(vehicleFromServer._id, vehicleFromServer._type, 
        vehicleFromServer._capacity, vehicleFromServer._speed,
        vehicleFromServer.location, vehicleFromServer._passengers);
    }
  }

  // Might need to add conversatoin in the next week.
  export type ServerVehicle = { _id: string, _type: string, _capacity: number, _speed: number, location: VehicleLocation, _passengers: Passenger[]};
  
  export type Direction = 'front'|'back'|'left'|'right';
  
  export type VehicleLocation = {
    x: number,
    y: number,
    rotation: Direction,
    moving: boolean,
  }
  
  export type Passenger = {
      player: ServerPlayer,
      isDriver: boolean,
      vehicleByID: string,
  };
  