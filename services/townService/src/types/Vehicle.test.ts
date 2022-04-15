import Car from './Car';
import SkateBoard from './SkateBoard';
import Dinosaur from './Dinosaur';

describe('check Car construction', () => {
  const car = new Car();
  it('should have 4 capacipity', ()=>{
    expect(car.capacity === 4).toBe(true);
  }); 
  it('should have 10 velocity', ()=>{
    expect(car.speed === 2).toBe(true);
  });
  it('should return car string when call getVehicleType', () => {
    expect(car.getVehicleType() === 'Car').toBe(true);
  });
});

describe('check SkateBoard construction', () => {
  const skateBoard = new SkateBoard();
  it('should have 1 capacipity', ()=>{
    expect(skateBoard.capacity === 1).toBe(true);
  });
  it('should have 2 velocity', ()=>{
    expect(skateBoard.speed === 1.2).toBe(true);
  });
  it('should return skateBoard string when call getVehicleType', () => {
    expect(skateBoard.getVehicleType() === 'SkateBoard').toBe(true);
  });
});

describe('check Dinosaur construction', () => {
  const dinosaur = new Dinosaur();
  it('should have 2 capacipity', ()=>{
    expect(dinosaur.capacity === 2).toBe(true);
  });
  it('should have 5 velocity', ()=>{
    expect(dinosaur.speed === 1.5).toBe(true);
  });
  it('should return car string when call getVehicleType', () => {
    expect(dinosaur.getVehicleType() === 'Dinosaur').toBe(true);
  });
});

