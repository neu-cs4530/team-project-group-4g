import { nanoid } from 'nanoid';
import Car from './Car';
import Passenger from './Passenger';
import Player from './Player';
import Vehicle from './Vehicle';

describe('check for Car to work properly', () => {
  const car: Vehicle = new Car();
  it('should inherit the correct value from Vehicle', () => {
    expect(car.location.x).toBe(0);
    expect(car.location.y).toBe(0);
    expect(car.location.rotation).toBe('back');
    expect(car.location.moving).toBe(false);
    expect(car.id).toBeDefined();
    expect(car.passengers).toBeDefined();
    expect(car.passengers.length).toBe(0);
    expect(car.lock).toBe(false);
    expect(car.conversationArea).toBeUndefined();
  });
  it('should construct a valid car', ()=>{
    expect(car.capacity).toBe(4);
    expect(car.speed).toBe(2);
  });
  it('test getVehicleType should return car', () => {
    expect(car.getVehicleType() === 'Car').toBe(true);
  });
  it('test addPassenger works on a car', () => {
    const driver: Passenger = new Passenger(new Player(nanoid()), 'Car', true);
    expect(car.passengers.length).toBe(0);
    car.addPassenger(driver);
    expect(car.passengers.length).toBe(1);
  });
  it('test gainDriverID works on a car', () => {
    const driverID = car.passengers[0].id;
    const passenger: Passenger = new Passenger(new Player(nanoid()), 'Car', false);
    car.addPassenger(passenger);
    expect(car.gainDriverID() === driverID).toBe(true);
  });
});