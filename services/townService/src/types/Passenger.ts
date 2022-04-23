import Player from './Player';
import { ServerConversationArea } from '../client/TownsServiceClient';

/**
 * Each player who is in/on a vehicle is represented by a Passenger object
 */
export default class Passenger {

  /** Whether or not this passenger is a driver, if being in a vehicle */
  private readonly _isDriver: boolean;

  /** The corresponding Player */
  private readonly _player: Player;

  /** The vehicle this passenger is currently in, if any */
  private readonly _vehicleByID: string;

  constructor(player: Player, vehicleByID: string, isDriver = true) {
    this._player = player;
    this._vehicleByID = vehicleByID;
    this._isDriver = isDriver;
  }

  get vehicleByID(): string {
    return this._vehicleByID;
  }


  get isDriver(): boolean {
    return this._isDriver;
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
