import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { VehicleLocation } from '../CoveyTypes';

/**
 * Each vehicle which is connected to a town is represented by a Vehicle object.
 * To be notified, vehicle is an abstract class. 
 */
export default abstract class Vehicle {

  /** The current location of this vehicle */
  public location: VehicleLocation;

  /** The unique identifier for this vehicle */
  private readonly _id: string;

  /** The maximum capacity of this vehicle */
  protected _capacity?: number;

  /** The speed of this vehicle (i.e., the number of time greater than the walking speed of a player) */
  protected _speed?: number;

  /** A list of current passengers in/on this vehicle */
  // private _passengers?: Passenger[];
  private _passengersByID: string[];

  /**
   * The vehicle's unique conversation area
   * extends conversation area?
   */
  private _conversationArea: ServerConversationArea | undefined;

  constructor() {
    this.location = {
      x: 50,
      y: 50,
      moving: false,
      rotation: 'back',
    };

    this._id = nanoid();
    this._passengersByID = [];
  }

  get id(): string {
    return this._id;
  }

  get capacity(): number | undefined {
    return this._capacity;
  }

  get speed(): number | undefined {
    return this._speed;
  }

  get passengersByID(): string[] {
    return this._passengersByID;
  }

  set passengersByID(passengersByID: string[]) {
    this._passengersByID = passengersByID;
  }

  get conversationArea(): ServerConversationArea | undefined {
    return this._conversationArea;
  }

  set conversationArea(conversationArea: ServerConversationArea | undefined) {
    this._conversationArea = conversationArea;
  }

  abstract getVehicleType(): string;

  /** Add the passenger to the vehicle list of Passengers by ID */
  addPassengerByID(passengerID: string): void {
    this._passengersByID.push(passengerID);
  }

}