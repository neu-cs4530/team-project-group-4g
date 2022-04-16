import assert from 'assert';
import { useContext } from 'react';
import VehicleMovementContext, { VehicleMovementCallback } from '../contexts/VehicleMovementContext';

/**
 * This hook exposes direct access to the array of callbacks that the game invokes *every* time that
 * a player moves. Components that need to know when players move should register a callback by pushing
 * it into this array, and upon unmount, remove that callback by splicing it out of this array.
 * 
 * There be dragons here, this is a good long-term refactoring candidate.
 */
export default function useVehicleMovement(): VehicleMovementCallback[] {
  const ctx = useContext(VehicleMovementContext);
  assert(ctx, 'Player movmeent context should be defined.');
  return ctx;
}
