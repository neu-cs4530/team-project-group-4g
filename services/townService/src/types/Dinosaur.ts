import Vehicle from './Vehicle';

/**
 * One type of the vehicle, which is a car vehicle. 
 */
export default class Dinosaur extends Vehicle {
  private _type: string;

  constructor() {
    super();
    this._capacity = 2;
    this._speed = 5;
    this._type = 'Dinosaur';
  }

  getVehicleType(): string {
    return this._type;
  }
}