import Vehicle from './Vehicle';

/**
 * Car is a type of vehicle. 
 */
export default class Car extends Vehicle{
  private _type : string;

  constructor() {
    super();
    this._capacity = 4;
    this._speed = 2;
    this._type = 'Car';
  }

  getVehicleType(): string {
    return this._type;
  }   
}