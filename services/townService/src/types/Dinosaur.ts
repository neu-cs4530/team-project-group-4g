import Vehicle from './Vehicle';

/**
 * Dinosaur is a type of vehicle. 
 */
export default class Dinosaur extends Vehicle{
  private _type : string;

  constructor() {
    super();
    this._capacity = 2;
    this._speed = 1.5;
    this._type = 'Dinosaur';
  }

  /**
   * 
   * @returns 
   */
  getVehicleType(): string {
    return this._type;
  }   
}