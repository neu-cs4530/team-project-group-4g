import { VehicleLocation } from './CoveyTypes';

describe('check for creating vehicle location', () => {
  const location: VehicleLocation = { x: 0, y: 0, rotation: 'front', moving: false };
  it('should produce a valid vehicle location', ()=>{
    expect(location.x).toBe(0);
    expect(location.y).toBe(0);
    expect(location.rotation).toBe('front');
    expect(location.moving).toBe(false);
  });
});