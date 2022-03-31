import Player from './Player';
import Vehicle from './Vehicle';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Passenger extends Player {
  /** The vehicle this passenger is currently in, if any */
  private _vehicle?: Vehicle;

  /** Whether or not this passenger is a driver, if being in a vehicle */
  private _isDriver?: boolean;

  constructor(userName: string) {
    super(userName);
    this._vehicle = undefined;
    this._isDriver = undefined;
  }

  get vehicle(): Vehicle | undefined {
    return this._vehicle;
  }

  set vehicle(vehicle: Vehicle | undefined) {
    this._vehicle = vehicle;
  }

  get isDriver(): boolean | undefined {
    return this._isDriver;
  }

  set isDriver(isDriver: boolean | undefined) {
    this._isDriver = isDriver;
  }
}
