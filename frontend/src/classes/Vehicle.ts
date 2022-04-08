export default class Vehicle {

  /**
   * Needs to add more potential fields later...
   */

  public location?: VehicleLocation;

  public sprite?: Phaser.GameObjects.Sprite;

  constructor(location: VehicleLocation) {
    this.location = location;
  }

  static fromServerVehicle(vehicleFromServer: ServerVehicle) {
    return new Vehicle(vehicleFromServer.location)
  }
}

export type ServerVehicle = { location: VehicleLocation };

export type Direction = 'front' | 'back' | 'left' | 'right';

/**
 * Vehicle location type
 */
export type VehicleLocation = {
  x: number;
  y: number;
  rotation: Direction;
  moving: boolean;
};