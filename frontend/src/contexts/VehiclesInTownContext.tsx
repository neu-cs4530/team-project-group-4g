import React from 'react';
import Vehicle from '../classes/Vehicle';

const Context = React.createContext<Vehicle[]>([]);

export default Context;
