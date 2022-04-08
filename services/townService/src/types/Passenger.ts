import Player from './Player';
import Vehicle from './Vehicle';
import { ServerConversationArea } from '../client/TownsServiceClient';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Passenger {

  /** Whether or not this passenger is a driver, if being in a vehicle */
  private _isDriver: boolean;

  /** The corresponding Player */
  private _player: Player;

  /** The vehicle this passenger is currently in, if any */
  private _vehicle: Vehicle;

  constructor(player: Player, vehicle: Vehicle, isDriver = false) {
    this._player = player;
    this._vehicle = vehicle;
    this._isDriver = isDriver;
  }

  get vehicle(): Vehicle {
    return this._vehicle;
  }

  set vehicle(vehicle: Vehicle) {
    this._vehicle = vehicle;
  }

  get isDriver(): boolean {
    return this._isDriver;
  }

  set isDriver(isDriver: boolean) {
    this._isDriver = isDriver;
  }

  get userName(): string {
    return this._player.userName;
  }

  get id(): string {
    return this._player.id;
  }

  get activeConversationArea(): ServerConversationArea | undefined {
    return this._player.activeConversationArea;
  }

  set activeConversationArea(conversationArea: ServerConversationArea | undefined) {
    this._player.activeConversationArea = conversationArea;
  }
}
