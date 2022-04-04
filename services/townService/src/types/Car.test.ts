import Car from './Car';
describe('check skateboard speed', () => {
    const car = new Car();
    it('should have 4 capacipity', ()=>{
      expect(car.capacity === 4).toBe(true);
    });

    it('should have speed as 5', ()=>{
        expect(car.speed === 10).toBe(true);
      });
  });