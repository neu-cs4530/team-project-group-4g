import { nanoid } from 'nanoid';
import SkateBoard from './SkateBoard';
import Passenger from './Passenger';
import Player from './Player';
import Vehicle from './Vehicle';

describe('check for SkateBoard to work properly', () => {
  const skateboard: Vehicle = new SkateBoard();
  it('should inherit the correct value from Vehicle', () => {
    expect(skateboard.location.x).toBe(0);
    expect(skateboard.location.y).toBe(0);
    expect(skateboard.location.rotation).toBe('back');
    expect(skateboard.location.moving).toBe(false);
    expect(skateboard.id).toBeDefined();
    expect(skateboard.passengers).toBeDefined();
    expect(skateboard.passengers.length).toBe(0);
    expect(skateboard.lock).toBe(false);
    expect(skateboard.conversationArea).toBeUndefined();
  });
  it('should construct a valid skateboard', ()=>{
    expect(skateboard.capacity).toBe(1);
    expect(skateboard.speed).toBe(1.2);
  });
  it('test getVehicleType should return SkateBoard', () => {
    expect(skateboard.getVehicleType() === 'SkateBoard').toBe(true);
  });
  it('test addPassenger works on a skateboard', () => {
    const driver: Passenger = new Passenger(new Player(nanoid()), 'SkateBoard', true);
    expect(skateboard.passengers.length).toBe(0);
    skateboard.addPassenger(driver);
    expect(skateboard.passengers.length).toBe(1);
  });
  it('test gainDriverID works on a skateboard', () => {
    const driverID = skateboard.passengers[0].id;
    expect(skateboard.gainDriverID() === driverID).toBe(true);
  });
});