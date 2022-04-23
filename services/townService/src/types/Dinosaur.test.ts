import { nanoid } from 'nanoid';
import Dinosaur from './Dinosaur';
import Passenger from './Passenger';
import Player from './Player';
import Vehicle from './Vehicle';

describe('check for Dinosaur to work properly', () => {
  const dinosaur: Vehicle = new Dinosaur();
  it('should inherit the correct value from Vehicle', () => {
    expect(dinosaur.location.x).toBe(0);
    expect(dinosaur.location.y).toBe(0);
    expect(dinosaur.location.rotation).toBe('back');
    expect(dinosaur.location.moving).toBe(false);
    expect(dinosaur.id).toBeDefined();
    expect(dinosaur.passengers).toBeDefined();
    expect(dinosaur.passengers.length).toBe(0);
    expect(dinosaur.lock).toBe(false);
    expect(dinosaur.conversationArea).toBeUndefined();
  });
  it('should construct a valid dinosaur', ()=>{
    expect(dinosaur.capacity).toBe(2);
    expect(dinosaur.speed).toBe(1.5);
  });
  it('test getVehicleType should return Dinosaur', () => {
    expect(dinosaur.getVehicleType() === 'Dinosaur').toBe(true);
  });
  it('test addPassenger works on a dinosaur', () => {
    const driver: Passenger = new Passenger(new Player(nanoid()), 'Dinosaur', true);
    expect(dinosaur.passengers.length).toBe(0);
    dinosaur.addPassenger(driver);
    expect(dinosaur.passengers.length).toBe(1);
  });
  it('test gainDriverID works on a dinosaur', () => {
    const driverID = dinosaur.passengers[0].id;
    const passenger: Passenger = new Passenger(new Player(nanoid()), 'Dinosaur', false);
    dinosaur.addPassenger(passenger);
    expect(dinosaur.gainDriverID() === driverID).toBe(true);
  });
});