import { nanoid } from "nanoid";
import { VehicleLocation } from '../CoveyTypes';
/**
 * Each vehicle which is connected to a town is represented by a Vehicle object
 */
export default class Vehicle {

  /** The current location of this vehicle */
  public location: VehicleLocation;

  /** The unique identifier for this vehicle */
  private readonly _id: string;

  /** The current capacity of this vehicle */
  private readonly _capacity: number;

  /**  */
  constructor() {
    this.location = {
      x: 50,
      y: 50,
      moving: false,
      rotation: 'back',
    }
    this._id = nanoid();
    this._capacity = 4;
  }

  get id(): string {
    return this._id;
  }

  get capacity(): number {
    return this._capacity;
  }
}