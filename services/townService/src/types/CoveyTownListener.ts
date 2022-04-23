import { ServerConversationArea } from '../client/TownsServiceClient';
import { ChatMessage } from '../CoveyTypes';
import Passenger from './Passenger';
import Player from './Player';
import Vehicle from './Vehicle';

/**
 * A listener for player-related events in each town
 */
export default interface CoveyTownListener {
  /**
   * Called when a player joins a town
   * @param newPlayer the new player
   */
  onPlayerJoined(newPlayer: Player): void;

  /**
   * Called when a player's location changes
   * @param movedPlayer the player that moved
   */
  onPlayerMoved(movedPlayer: Player): void;

  /**
   * Called when a player change to invisible.
   * @param invisiblePlayer
   */
  onPlayerInvisible(invisiblePlayer: Player):void;

  /**
   * Called when a player change to visible.
   * @param visiblePlayer
   */
  onPlayerVisible(visiblePlayer: Player):void;

  /**
   * Called when a vehicle's location changes
   * @param movedVehicle the vehicle that moved 
   */
  onVehicleMoved(movedVehicle: Vehicle): void;

  onVehicleChangeLockSituation(updatedVehicle: Vehicle): void;

  /**
   * Called when a player disconnects from the town
   * @param removedPlayer the player that disconnected
   */
  onPlayerDisconnected(removedPlayer: Player): void;

  /**
   * Called when a town is destroyed, causing all players to disconnect
   */
  onTownDestroyed(): void;

  /**
   * Called when a conversation area is created or updated
   * @param conversationArea the conversation area that is updated or created
   */
  onConversationAreaUpdated(conversationArea: ServerConversationArea): void;

  /**
   * Called when a conversation area is destroyed
   * @param conversationArea the conversation area that has been destroyed
   */
  onConversationAreaDestroyed(conversationArea: ServerConversationArea): void;

  /**
   * Called when a chat message is received from a user
   * @param message the new chat message
   */
  onChatMessage(message: ChatMessage): void;

  /**
   * Called when a player joins a town
   * @param passenger the new player
   */
  onPlayerJoinedVehicle(passenger: Passenger): void;

  /**
   * Called when a player create a vehicle
   * @param newVehicle the new vehicle
   */
  onVehicleCreated(newVehicle: Vehicle): void;

  /**
   * Called when a vehicle's passenger list got updated
   * @param updatedVehicle the updated vehicle
   * @param passengerPlayer the updated passenger
   */
  onVehicleUpdatePassengers(updatedVehicle: Vehicle, passengerPlayer: Player): void;

  /**
   * Called when a passenger gets off a vehicle
   * @param updatedVehicle the updated vehicle
   * @param passengerPlayer the passenger who gets off
   */
  onVehicleGetOffPassenger(updatedVehicle: Vehicle, passengerPlayer: Player): void;

  /**
   * Called when a vehicle got destroyed, causing all passengers to get off the vehicle
   * @param destroyedVehicle the destroyed vehicle
   * @param passengerPlayerList the vehicle's passenger list
   */
  onVehicleDestroyed(destroyedVehicle: Vehicle, passengerPlayerList: Player[]): void;

}
