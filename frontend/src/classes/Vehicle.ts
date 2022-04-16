import { ServerPlayer } from "./Player";
  
  export default class Vehicle {
    public location?: VehicleLocation;

    public passengers?: Passenger[];
  
    private readonly _id: string;
  
    private readonly _vehicleType: string;

    private readonly _capacity: number;

    private readonly _speed: number;
  
    public sprite?: Phaser.GameObjects.Sprite;

    public label?: Phaser.GameObjects.Text;
  
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

    gainDriverID() : string {
      const passengerList = this.passengers;
      if (passengerList){
        // console.log('exist')
        for (let i = 0; i < passengerList.length; i += 1){
          // console.log('length')
          // console.log(passengerList[i])
          if (passengerList[i]._isDriver === true){
            // console.log('checkDriver')
            return passengerList[i]._player._id;
          }
        }
      }
      throw Error('No Driver on the vehicle');
    }

    includesPassenger(passengerID: string): boolean {
      const passengerList = this.passengers;
      // console.log(passengerList);
      if (passengerList){
        for (let i = 0; i < passengerList.length; i += 1){
          if (passengerList[i]._player._id === passengerID){
            return true;
          }
        }
      }
      return false;
    }
  

    gainDriverUserName() : string {
      const passengerList = this.passengers;
      if (passengerList){
        // console.log('exist')
        for (let i = 0; i < passengerList.length; i += 1){
          // console.log('lenth')
          if (passengerList[i]._isDriver === true){
            // console.log('drive')
            return passengerList[i]._player._userName;
          }
        }
      }
      throw Error('No Driver on the vehicle');
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
  
  export type Passenger = {_isDriver: boolean, _player: ServerPlayer, _vehicleByID: string};
  