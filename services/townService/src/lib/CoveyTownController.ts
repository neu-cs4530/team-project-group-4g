import { customAlphabet, nanoid } from 'nanoid';
import { BoundingBox, ServerConversationArea } from '../client/TownsServiceClient';
import { ChatMessage, UserLocation, VehicleLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Passenger from '../types/Passenger';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import Vehicle from '../types/Vehicle';
import Car from '../types/Car';
import IVideoClient from './IVideoClient';
import TwilioVideo from './TwilioVideo';
import Dinosaur from '../types/Dinosaur';
import SkateBoard from '../types/SkateBoard';

const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveyTownController {
  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get conversationAreas(): ServerConversationArea[] {
    return this._conversationAreas;
  }

  get vehicles(): Vehicle[] {
    return this._vehicles;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of valid sessions for this town * */
  private _sessions: PlayerSession[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveyTownListener[] = [];

  /** The list of currently active ConversationAreas in this town */
  private _conversationAreas: ServerConversationArea[] = [];

  private readonly _coveyTownID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  // private _vehicles: Vehicle[] = [];
  private _vehicles: Vehicle[] = [];

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID();
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
  }

  /**
   * Finds the vehicle in the list.
   * 
   * @param passengerID A passenger ids
   * @returns The vehicle that contains ids
   */
  findVehicle(passengerID: string): Vehicle | undefined {
    const vehicleList = this._vehicles;
    let vehicleWithPassengerID;
    for (let i = 0; i < vehicleList.length; i += 1) {
      if (vehicleList[i].gainDriverID() === passengerID) {
        vehicleWithPassengerID = vehicleList[i];
        break;
      }
    }
    return vehicleWithPassengerID;
  }

  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);
    this._players.push(newPlayer);

    // Create a video token for this user to join this town
    theSession.videoToken = await this._videoClient.getTokenForTown(
      this._coveyTownID,
      newPlayer.id,
    );

    // Notify other players that this player has joined
    this._listeners.forEach(listener => listener.onPlayerJoined(newPlayer));

    return theSession;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  destroySession(session: PlayerSession): void {
    this._players = this._players.filter(p => p.id !== session.player.id);
    this._sessions = this._sessions.filter(s => s.sessionToken !== session.sessionToken);
    this._listeners.forEach(listener => listener.onPlayerDisconnected(session.player));
    const conversation = session.player.activeConversationArea;
    if (conversation) {
      this.removePlayerFromConversationArea(session.player, conversation);
    }
  }

  /**
   * Updates the location of a player within the town
   * 
   * If the player has changed conversation areas, this method also updates the
   * corresponding ConversationArea objects tracked by the town controller, and dispatches
   * any onConversationUpdated events as appropriate
   * 
   * @param player Player to update location for
   * @param location New location for this player
   */
  updatePlayerLocation(player: Player, location: UserLocation): void {
    const conversation = this.conversationAreas.find(conv => conv.label === location.conversationLabel);
    const prevConversation = player.activeConversationArea;

    player.location = location;
    player.activeConversationArea = conversation;

    if (conversation !== prevConversation) {
      if (prevConversation) {
        this.removePlayerFromConversationArea(player, prevConversation);
      }
      if (conversation) {
        conversation.occupantsByID.push(player.id);
        this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
      }
    }

    this._listeners.forEach(listener => listener.onPlayerMoved(player));
  }

  /**
   * Create a vehicle object when a player requests to switch to certain type of transportation.
   * 
   * @param driver the player who initializes the vehicle
   * @param initLocation the current player location
   * @param vehicleType the type of tranportation the player requests
   */
  createInitVehicle(driver: Player, initLocation: UserLocation, vehicleType: string): void{
    let newVehicle: Vehicle;
    switch (vehicleType) {
      case 'Car':
        newVehicle = new Car();
        newVehicle.location = {
          x: initLocation.x,
          y: initLocation.y,
          moving: initLocation.moving,
          rotation: initLocation.rotation,
        };
        break;
      case 'Dinosaur':
        newVehicle = new Dinosaur();
        newVehicle.location = {
          x: initLocation.x,
          y: initLocation.y,
          moving: initLocation.moving,
          rotation: initLocation.rotation,
        };
        break;
      case 'SkateBoard':
        newVehicle = new SkateBoard();
        newVehicle.location = {
          x: initLocation.x,
          y: initLocation.y,
          moving: initLocation.moving,
          rotation: initLocation.rotation,
        };
        break;
      default:
        // throw new Error('The vehicle type is not applicable');
        return;
    }
    driver.visible = false;
    newVehicle.addPassenger(new Passenger(driver, newVehicle.id, true));
    this._vehicles.push(newVehicle);
    this._listeners.forEach(listener => listener.onPlayerInvisible(driver));
    this._listeners.forEach(listener => listener.onVehicleCreated(newVehicle));
  }

  /**
   * Add the player as a passenger into the vehicle when they get in.
   * 
   * @param passengerPlayer The player who gets in
   * @param vehicleID The id of the vehicle
   */
  getOnVehicle(passengerPlayer: Player, vehicleID: string) : void {
    passengerPlayer.visible = false;
    const vehicle = this._vehicles.find(v => v.id === vehicleID);
    if (vehicle){
      const passenger = new Passenger(passengerPlayer, vehicleID, false);
      vehicle.passengers.push(passenger);
      this._listeners.forEach(listener => listener.onVehicleUpdatePassengers(vehicle, passengerPlayer));
    }
  }

  /**
   * Delete the player from the vehicle as they get off.
   * 
   * @param passengerPlayer The player who gets off
   * @param vehicleID The id of the given vehicle
   */
  getOffVehicle(passengerPlayer: Player, vehicleID: string) : void {
    passengerPlayer.visible = true;
    const vehicle = this._vehicles.find(v => v.id === vehicleID);
    if (vehicle){
      vehicle.passengers = vehicle.passengers.filter(p => p.id !== passengerPlayer.id);
      this._listeners.forEach(listener => listener.onVehicleGetOffPassenger(vehicle, passengerPlayer));
    }
  }

  /**
   * Destroy the vehicle as all passenger(s) get off.
   * 
   * @param vehicleID The id of the given vehicle
   */
  destroyVehicle(vehicleID: string) : void {
    const vehicle = this._vehicles.find(v => v.id === vehicleID);
    if (!vehicle){
      // throw new Error('You could not destroy an unexist vehicle');
    } else {
      const passengerPlayerList : Player[] = [];
      for (let i = 0; i < vehicle.passengers.length; i += 1){
        const player = this.players.find(p => p.id === vehicle.passengers[i].id);
        if (player){
          player.visible = true;
          passengerPlayerList.push(player);
        }
      }
      this._vehicles = this._vehicles.filter(v => v.id !== vehicle.id);
      this._listeners.forEach(listener => listener.onVehicleDestroyed(vehicle, passengerPlayerList));
    }
  }

  /**
   * Removes a player from a conversation area, updating the conversation area's occupants list, 
   * and emitting the appropriate message (area updated or area destroyed)
   * 
   * Does not update the player's activeConversationArea property.
   * 
   * @param player Player to remove from conversation area
   * @param conversation Conversation area to remove player from
   */
  removePlayerFromConversationArea(player: Player, conversation: ServerConversationArea): void {
    conversation.occupantsByID.splice(conversation.occupantsByID.findIndex(p => p === player.id), 1);
    if (conversation.occupantsByID.length === 0) {
      this._conversationAreas.splice(this._conversationAreas.findIndex(conv => conv === conversation), 1);
      this._listeners.forEach(listener => listener.onConversationAreaDestroyed(conversation));
    } else {
      this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
    }
  }

  /**
   * Creates a new conversation area in this town if there is not currently an active
   * conversation with the same label.
   *
   * Adds any players who are in the region defined by the conversation area to it.
   *
   * Notifies any CoveyTownListeners that the conversation has been updated
   *
   * @param _conversationArea Information describing the conversation area to create. Ignores any
   *  occupantsById that are set on the conversation area that is passed to this method.
   *
   * @returns true if the conversation is successfully created, or false if not
   */
  addConversationArea(_conversationArea: ServerConversationArea): boolean {
    if (this._conversationAreas.find(
      eachExistingConversation => eachExistingConversation.label === _conversationArea.label,
    )) {
      return false;
    }
    if (_conversationArea.topic === '') {
      return false;
    }
    if (this._conversationAreas.find(eachExistingConversation =>
      CoveyTownController.boxesOverlap(eachExistingConversation.boundingBox, _conversationArea.boundingBox)) !== undefined) {
      return false;
    }
    const newArea: ServerConversationArea = Object.assign(_conversationArea);
    this._conversationAreas.push(newArea);
    const playersInThisConversation = this.players.filter(player => player.isWithin(newArea));
    playersInThisConversation.forEach(player => { player.activeConversationArea = newArea; });
    newArea.occupantsByID = playersInThisConversation.map(player => player.id);
    this._listeners.forEach(listener => listener.onConversationAreaUpdated(newArea));
    return true;
  }

  /**
   * Detects whether two bounding boxes overlap and share any points
   * 
   * @param box1 
   * @param box2 
   * @returns true if the boxes overlap, otherwise false
   */
  static boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    // Helper function to extract the top left (x1,y1) and bottom right corner (x2,y2) of each bounding box
    const toRectPoints = (box: BoundingBox) => ({ x1: box.x - box.width / 2, x2: box.x + box.width / 2, y1: box.y - box.height / 2, y2: box.y + box.height / 2 });
    const rect1 = toRectPoints(box1);
    const rect2 = toRectPoints(box2);
    const noOverlap = rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2 || rect1.y1 >= rect2.y2 || rect2.y1 >= rect1.y2;
    return !noOverlap;
  }

  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */
  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */
  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter(v => v !== listener);
  }

  onChatMessage(message: ChatMessage): void {
    this._listeners.forEach(listener => listener.onChatMessage(message));
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find(p => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach(listener => listener.onTownDestroyed());
  }

  /**
   * Updates the location for this vehicle and the location of all passengers in it within the town.
   * 
   * If the vehicle has changed the location, this method also updates the
   * corresponding Player or Passenger objects tracked by the town controller, and dispatches
   * 
   * @param vehicle Vehicle to update location for
   * @param location New location for this vehicle
   */
  updateVehicleLocation(vehicle: Vehicle | undefined, location: VehicleLocation): void {
    if (vehicle === undefined) {
      return;
    }
    if (vehicle.passengers === undefined) {
      return;
    }

    vehicle.location = location;

    const newUserLocation: UserLocation = {
      x: location.x,
      y: location.y,
      rotation: location.rotation,
      moving: location.moving,
    };

    for (let i = 0; i < vehicle.passengers.length; i += 1) {
      const p = this.players.find(player => player.id === vehicle.passengers[i].id);
      if (p !== undefined) {
        this.updatePlayerLocation(p, newUserLocation);
      }
    }

    this._listeners.forEach(listener => listener.onVehicleMoved(vehicle));
  }

  /**
   * Lock or unlock the given vehicle (which is controlled by the driver).
   * 
   * @param vehicleID The vehicle id
   */
  changeVehicleLockSituation(vehicleID: string): void {
    const vehicle = this._vehicles.find(v => v.id === vehicleID);
    if (!vehicle){
      // throw new Error('There is no such vehicle with the specific vehicle ID.');
    } else {
      vehicle.lock = !vehicle.lock;
      this._listeners.forEach(listener => listener.onVehicleChangeLockSituation(vehicle));
    }
  }
}

