import Vehicle from './Vehicle';

/**
 * One type of the vehicle, which is a car vehicle. 
 */
export default class SkateBoard extends Vehicle{
  private _type : string;

  constructor() {
    super();
    this._capacity = 1;
    this._speed = 2;
    this._type = 'SkateBoard';
  }

  getVehicleType(): string {
    return this._type;
  }   
}