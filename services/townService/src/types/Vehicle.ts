import { nanoid } from 'nanoid';
import { VehicleLocation } from '../CoveyTypes';
import Passenger from './Passenger';
/**
 * Each vehicle which is connected to a town is represented by a Vehicle object
 */
export default class Vehicle {

  /** The current location of this vehicle */
  public location: VehicleLocation;

  /** The unique identifier for this vehicle */
  private readonly _id: string;

  /** The maximum capacity of this vehicle */
  private readonly _capacity: number;

  /** The speed of this vehicle (i.e., the number of time greater than the walking speed of a player) */
  private readonly _speed: number;

  /** A list of current passengers in/on this vehicle */
  private _passengers?: Passenger[];

  constructor() {
    this.location = {
      x: 50,
      y: 50,
      moving: false,
      rotation: 'back',
    };

    this._id = nanoid();
    this._capacity = 4;
    this._speed = 2;
    this._passengers = [];
  }

  get id(): string {
    return this._id;
  }

  get capacity(): number {
    return this._capacity;
  }

  get speed(): number {
    return this._speed;
  }

  get passengers(): Passenger[] {
    return this.passengers;
  }

  set passengers(passengers: Passenger[] | undefined) {
    this._passengers = passengers;
  }
}