import { nanoid } from 'nanoid';
import Car from './Car';
import Vehicle from './Vehicle';
import Passenger from './Passenger';
import Player from './Player';

describe('should construct a valid vehicle', () => {
  const car: Vehicle = new Car();
  it('should create a valid vehicle', () => {
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
  it('test getVehicleType returns a defined value', () => {
    expect(car.getVehicleType).toBeDefined();
  });
  it('test addPassenger add the given passenger to the passenger list', () => {
    const driver: Passenger = new Passenger(new Player(nanoid()), 'Car', true);
    expect(car.passengers.length).toBe(0);
    car.addPassenger(driver);
    expect(car.passengers.length).toBe(1);
  });
  it('test gainDriverID returns the correct driver id', () => {
    const driverID = car.passengers[0].id;
    const passenger: Passenger = new Passenger(new Player(nanoid()), 'Car', false);
    car.addPassenger(passenger);
    expect(car.gainDriverID() === driverID).toBe(true);
  });
});
