import assert from 'assert';
import { useContext } from 'react';
import Vehicle from '../classes/Vehicle';
import VehiclesInTownContext from '../contexts/VehiclesInTownContext';

/**
 * This hook provides access to the list of all vehicle objects in the town.
 * 
 * Components that use this hook will be re-rendered each time that the list of players in the town
 * changes (e.g. as players come and go).
 * 
 * Components that use this hook will NOT be re-rendered each time that a vehicle moves,
 * see useVehicleMovement if that is necessary
 */
export default function useVehiclesInTown(): Vehicle[] {
  const ctx = useContext(VehiclesInTownContext);
  assert(ctx, 'VehiclesInTownContext context should be defined.');
  return ctx;
}
