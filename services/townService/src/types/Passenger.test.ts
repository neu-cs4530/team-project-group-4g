import { nanoid } from 'nanoid';
import Player from './Player';
import Passenger from './Passenger';

describe('check for Passenger to work properly', () => {
  const player = new Player(nanoid());
  const playerID = player.id;
  const playerName = player.userName;
  const vehicleID = nanoid();
  const passenger = new Passenger(player, vehicleID, true);
  it('should construct a valid Passenger', ()=>{
    expect(passenger.id === playerID).toBe(true);
    expect(passenger.userName === playerName).toBe(true);
    expect(passenger.isDriver).toBe(true);
    expect(passenger.vehicleByID === vehicleID).toBe(true);
    expect(passenger.activeConversationArea).toBeUndefined();
  });
});