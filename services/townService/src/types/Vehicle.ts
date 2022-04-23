import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { VehicleLocation } from '../CoveyTypes';
import Passenger from './Passenger';

/**
 * Each vehicle which is connected to a town is represented by a Vehicle object.
 */
export default abstract class Vehicle {

  /** The current location of this vehicle */
  public location: VehicleLocation;

  /** The identifier for this vehicle */
  private readonly _id: string;

  /** The maximum capacity of this vehicle */
  protected _capacity?: number;

  /** The speed of this vehicle (i.e., the number of time greater than the walking speed of a player) */
  protected _speed?: number;

  /** A list of current passengers in/on this vehicle */
  private _passengers: Passenger[];
  // private _passengersByID: string[];

  private _lock: boolean;

  /**
   * The vehicle's unique conversation area
   * extends conversation area?
   */
  private _conversationArea: ServerConversationArea | undefined;

  constructor() {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'back',
    };

    this._id = nanoid();
    this._passengers = [];
    this._lock = false;
  }

  get id(): string {
    return this._id;
  }

  get capacity(): number | undefined {
    return this._capacity;
  }

  get speed(): number | undefined {
    return this._speed;
  }

  get passengers(): Passenger[] {
    return this._passengers;
  }

  set passengers(passengers: Passenger[]) {
    this._passengers = passengers;
  }

  get lock(): boolean {
    return this._lock;
  }

  set lock(isLock: boolean) {
    this._lock = isLock;
  }

  get conversationArea(): ServerConversationArea | undefined {
    return this._conversationArea;
  }

  set conversationArea(conversationArea: ServerConversationArea | undefined) {
    this._conversationArea = conversationArea;
  }

  /**
   * Get the type of the given vehicle.
   */
  abstract getVehicleType(): string;

  /** Add the passenger to the vehicle's list of Passengers */
  addPassenger(passenger: Passenger): void {
    this._passengers.push(passenger);
  }

  /**
   * Get the driver's id from the passenger list.
   * 
   * @returns the driver's id
   */
  gainDriverID() : string {
    const passengerList = this.passengers;
    for (let i = 0; i < passengerList.length; i += 1){
      if (passengerList[i].isDriver === true){
        return passengerList[i].id;
      }
    }
    return '';
  }

}