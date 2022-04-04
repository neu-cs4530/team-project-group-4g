import SkateBoard from './SkateBoard';
describe('check skateboard speed', () => {
    const skateboard = new SkateBoard();
    it('should have 1 capacipity', ()=>{
      expect(skateboard.capacity === 1).toBe(true);
    });

    it('should have speed as 5', ()=>{
        expect(skateboard.speed === 2).toBe(true);
      });
  });