import Vehicle from './Vehicle';

/**
 * Skateboard is a type of vehicle.
 */
export default class SkateBoard extends Vehicle{
  private _type : string;

  constructor() {
    super();
    this._capacity = 1;
    this._speed = 1.2;
    this._type = 'SkateBoard';
  }

  /**
   * 
   * @returns 
   */
  getVehicleType(): string {
    return this._type;
  }   
}