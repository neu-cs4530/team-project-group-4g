import CoveyTownController from './CoveyTownController';
import { CoveyTownList, VehicleLocation } from '../CoveyTypes';
import Player from '../types/Player';
import { ServerConversationArea } from '../client/TownsServiceClient';

function passwordMatches(provided: string, expected: string): boolean {
  if (provided === expected) {
    return true;
  }
  if (process.env.MASTER_TOWN_PASSWORD && process.env.MASTER_TOWN_PASWORD === provided) {
    return true;
  }
  return false;
}

export default class CoveyTownsStore {
  private static _instance: CoveyTownsStore;

  private _towns: CoveyTownController[] = [];

  /**
   * Retrieve the singleton CoveyTownsStore.
   * 
   * There is only a single instance of the CoveyTownsStore - it follows the singleton pattern
   */
  static getInstance(): CoveyTownsStore {
    if (CoveyTownsStore._instance === undefined) {
      CoveyTownsStore._instance = new CoveyTownsStore();
    }
    return CoveyTownsStore._instance;
  }

  /**
   * Given a town ID, fetch the CoveyTownController
   * @param coveyTownID town ID to fetch
   * @returns the existing town controller, or undefined if there is no such town ID
   */
  getControllerForTown(coveyTownID: string): CoveyTownController | undefined {
    return this._towns.find(town => town.coveyTownID === coveyTownID);
  }

  /**
   * @returns List of all publicly visible towns
   */
  getTowns(): CoveyTownList {
    return this._towns.filter(townController => townController.isPubliclyListed)
      .map(townController => ({
        coveyTownID: townController.coveyTownID,
        friendlyName: townController.friendlyName,
        currentOccupancy: townController.occupancy,
        maximumOccupancy: townController.capacity,
        /** Count vehicle list? */
      }));
  }

  /**
   * Creates a new town, registering it in the Town Store, and returning that new town
   * @param friendlyName 
   * @param isPubliclyListed 
   * @returns the new town controller
   */
  createTown(friendlyName: string, isPubliclyListed: boolean): CoveyTownController {
    const newTown = new CoveyTownController(friendlyName, isPubliclyListed);
    this._towns.push(newTown);
    return newTown;
  }

  /**
   * Updates an existing town. Validates that the provided password is valid
   * @param coveyTownID 
   * @param coveyTownPassword 
   * @param friendlyName 
   * @param makePublic 
   * @returns true upon success, or false otherwise
   */
  updateTown(coveyTownID: string, coveyTownPassword: string, friendlyName?: string, makePublic?: boolean): boolean {
    const existingTown = this.getControllerForTown(coveyTownID);
    if (existingTown && passwordMatches(coveyTownPassword, existingTown.townUpdatePassword)) {
      if (friendlyName !== undefined) {
        if (friendlyName.length === 0) {
          return false;
        }
        existingTown.friendlyName = friendlyName;
      }
      if (makePublic !== undefined) {
        existingTown.isPubliclyListed = makePublic;
      }
      return true;
    }
    return false;
  }

  /**
   * Deletes a given town from this towns store, destroying the town controller in the process.
   * Checks that the password is valid before deletion
   * @param coveyTownID 
   * @param coveyTownPassword 
   * @returns true if the town exists and is successfully deleted, false otherwise
   */
  deleteTown(coveyTownID: string, coveyTownPassword: string): boolean {
    const existingTown = this.getControllerForTown(coveyTownID);
    if (existingTown && passwordMatches(coveyTownPassword, existingTown.townUpdatePassword)) {
      this._towns = this._towns.filter(town => town !== existingTown);
      existingTown.disconnectAllPlayers();
      return true;
    }
    return false;
  }

  /**
   * adds the vehicle to this covey town
   * 
   * @param coveyTownID the covey town id
   * @param player the player in the covey town
   * @param conversationArea the conversation area to be added in the vehicle
   * @param vehicleType
   */
  addVehicle(coveyTownID: string, player: Player, conversationArea: ServerConversationArea): string | undefined {

    const existingTown = this.getControllerForTown(coveyTownID);

    // checks that this town exists
    if (existingTown) {
      if (!(player.location !== undefined &&
        player.location.x !== undefined &&
        player.location.y !== undefined)) {
        return 'Invalid Location:\nThe location to add the vehicle must be defined.';
      }

      const addResponse = existingTown.addVehicle(
        player,
        conversationArea,
        'car',
      );
      return addResponse;
    }
    return 'Invalid town:\nDouble check that the town exists.';
  }

  /**
   * 
   * @param coveyTownID 
   * @param vehicleLocation 
   */
  // deleteVehicle(coveyTownID: string, vehicleLocation: VehicleLocation): string | undefined {

  //   const existingTown = this.getControllerForTown(coveyTownID);

  //   if (existingTown) {
  //     const deleteResponse = existingTown.deleteVehicle();
  //   }
  // }
}
