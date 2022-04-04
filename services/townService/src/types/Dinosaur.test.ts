import Dinosaur from './Dinosaur';
describe('check skateboard speed', () => {
    const dinosaur = new Dinosaur();
    it('should have 2 capacipity', ()=>{
      expect(dinosaur.capacity === 2).toBe(true);
    });

    it('should have speed as 5', ()=>{
        expect(dinosaur.speed === 5).toBe(true);
      });
  });