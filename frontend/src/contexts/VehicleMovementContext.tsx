import React from 'react';
import { ServerVehicle } from '../classes/Vehicle';

export type VehicleMovementCallback = (vehicleMoved: ServerVehicle) => void;

const Context = React.createContext<VehicleMovementCallback[]>([]);

export default Context;
