import { nanoid } from 'nanoid';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import { Socket } from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import { UserLocation, VehicleLocation } from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import { townSubscriptionHandler } from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import * as TestUtils from '../client/TestUtils';

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveyTownController', () => {
  beforeEach(() => {
    mockTwilioVideo.getTokenForTown.mockClear();
  });
  it('constructor should set the friendlyName property', () => { 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController.friendlyName)
      .toBe(townName);
  });
  describe('addPlayer', () => { 
    it('should use the coveyTownID and player ID properties when requesting a video token',
      async () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
        expect(mockTwilioVideo.getTokenForTown).toBeCalledTimes(1);
        expect(mockTwilioVideo.getTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);
      });
  });
  describe('town listeners and events', () => {
    let testingTown: CoveyTownController;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
    });
    it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const newLocation = generateTestLocation();
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.updatePlayerLocation(player, newLocation);
      mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
    });
    it('should notify added listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.destroySession(session);
      mockListeners.forEach(listener => expect(listener.onPlayerDisconnected).toBeCalledWith(player));
    });
    it('should notify added listeners of new players when addPlayer is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));

      const player = new Player('test player');
      await testingTown.addPlayer(player);
      mockListeners.forEach(listener => expect(listener.onPlayerJoined).toBeCalledWith(player));

    });
    it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.disconnectAllPlayers();
      mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());

    });
    it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const newLocation = generateTestLocation();
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.updatePlayerLocation(player, newLocation);
      expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
    });
    it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();

    });
    it('should not notify removed listeners of new players when addPlayer is called', async () => {
      const player = new Player('test player');

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      const session = await testingTown.addPlayer(player);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
    });

    it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.disconnectAllPlayers();
      expect(listenerRemoved.onTownDestroyed).not.toBeCalled();

    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
    });
    it('should reject connections with invalid town IDs by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    it('should reject connections with invalid session tokens by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    describe('with a valid session token', () => {
      it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        await testingTown.addPlayer(player);
        expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
      });
      it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.updatePlayerLocation(player, generateTestLocation());
        expect(mockSocket.emit).toBeCalledWith('playerMoved', player);

      });
      it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.destroySession(session);
        expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
      });
      it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.disconnectAllPlayers();
        expect(mockSocket.emit).toBeCalledWith('townClosing');
        expect(mockSocket.disconnect).toBeCalledWith(true);
      });
      describe('when a socket disconnect event is fired', () => {
        it('should remove the town listener for that socket, and stop sending events to it', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            const newPlayer = new Player('should not be notified');
            await testingTown.addPlayer(newPlayer);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
          } else {
            fail('No disconnect handler registered');
          }
        });
        it('should destroy the session corresponding to that socket', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            mockReset(mockSocket);
            TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
            townSubscriptionHandler(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
          } else {
            fail('No disconnect handler registered');
          }

        });
      });
      it('should forward playerMovement events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
        const playerMovementHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerMovement');
        if (playerMovementHandler && playerMovementHandler[1]) {
          const newLocation = generateTestLocation();
          player.location = newLocation;
          playerMovementHandler[1](newLocation);
          expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
        } else {
          fail('No playerMovement handler registered');
        }
      });
    });
  });
  describe('addConversationArea', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `addConversationArea test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should add the conversation area to the list of conversation areas', ()=>{
      const newConversationArea = TestUtils.createConversationForTesting();
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const areas = testingTown.conversationAreas;
      expect(areas.length).toEqual(1);
      expect(areas[0].label).toEqual(newConversationArea.label);
      expect(areas[0].topic).toEqual(newConversationArea.topic);
      expect(areas[0].boundingBox).toEqual(newConversationArea.boundingBox);
    });
  });
  describe('updatePlayerLocation', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should respect the conversation area reported by the player userLocation.conversationLabel, and not override it based on the player\'s x,y location', async ()=>{
      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(player.activeConversationArea?.label).toEqual(newConversationArea.label);
      expect(player.activeConversationArea?.topic).toEqual(newConversationArea.topic);
      expect(player.activeConversationArea?.boundingBox).toEqual(newConversationArea.boundingBox);

      const areas = testingTown.conversationAreas;
      expect(areas[0].occupantsByID.length).toBe(1);
      expect(areas[0].occupantsByID[0]).toBe(player.id);

    }); 
    it('should emit an onConversationUpdated event when a conversation area gets a new occupant', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(1);
    });
  });
  describe('createInitVehicle', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `createInitVehicle test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should create a dinosaur as the player requested', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      const userInitLocation : UserLocation = { moving: false, rotation: 'front', x: 0, y: 0, conversationLabel: newConversationArea.label };
      player.location = userInitLocation;
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Dinosaur';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.vehicles[0].speed).toBe(1.5);
    });
    it('should create a skateboard as the player requested', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      const userInitLocation : UserLocation = { moving: false, rotation: 'front', x: 0, y: 0, conversationLabel: newConversationArea.label };
      player.location = userInitLocation;
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'SkateBoard';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.vehicles[0].speed).toBe(1.2);
    });
    it('should create a car as the player requested', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      const userInitLocation : UserLocation = { moving: false, rotation: 'front', x: 0, y: 0, conversationLabel: newConversationArea.label };
      player.location = userInitLocation;
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.vehicles[0].speed).toBe(2.0);
    });
    it('should add new vehicle into the list of current vehicles in town', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.vehicles.length).toBe(1);
    });
    it('should add player into the list of current players in the new vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.vehicles[0].passengers.length).toBe(1);
    });
    it('should emit onPlayerInvisible event when player switches to a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(mockListener.onPlayerInvisible).toHaveBeenCalledTimes(1);
    });
    it('should emit onVehicleCreated event when player switches to a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(mockListener.onVehicleCreated).toHaveBeenCalledTimes(1);
    });
  });
  describe('getOnVehicle', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `getOnVehicle test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should add player as a passenger of the given vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);
      expect(testingTown.vehicles[0].passengers.length).toBe(1);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.getOnVehicle(player, vehicleID);
      expect(testingTown.vehicles[0].passengers.length).toBe(2);
    });
    it('should emit onVehicleUpdatePassengers when player gets in a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.getOnVehicle(player, vehicleID);
      expect(mockListener.onVehicleUpdatePassengers).toHaveBeenCalledTimes(1);
    });
  });
  describe('findVehicle', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `findVehicle test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should return undefined given a invalid passenger id', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.findVehicle('1234')).toBeUndefined();
    });
    it('should find the correct vehicle given a valid passenger id', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      const playerID = player.id;
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      expect(testingTown.findVehicle(playerID)).toEqual(testingTown.vehicles[0]);
    });
  });
  describe('updateVehicleLocation', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updateVehicleLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should update the locations of all passengers to where the vehicle moved to', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      const userInitLocation : UserLocation = { moving: false, rotation: 'front', x: 0, y: 0, conversationLabel: newConversationArea.label };
      player.location = userInitLocation;
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const newLocation : VehicleLocation = { moving: false, rotation: 'front', x: 25, y: 25 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      testingTown.updateVehicleLocation(testingTown.vehicles[0], newLocation);
      expect(testingTown.players[0].location.x).toEqual(25);
      expect(mockListener.onVehicleMoved).toHaveBeenCalledTimes(1);
    });
    it('should emit onVehicleMoved event when vehicle moves to a new location', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const newLocation : VehicleLocation = { moving: false, rotation: 'front', x: 25, y: 25 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      testingTown.updateVehicleLocation(testingTown.vehicles[0], newLocation);
      expect(mockListener.onVehicleMoved).toHaveBeenCalledTimes(1);
    });
  });
  describe('getOffVehicle', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `getOffVehicle test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should delete player as a passenger of the given vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);
      expect(testingTown.vehicles[0].passengers.length).toBe(1);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.getOffVehicle(player, vehicleID);
      expect(testingTown.vehicles[0].passengers.length).toBe(0);
    });
    it('should emit onVehicleGetOffPassenger when player gets off a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.getOffVehicle(player, vehicleID);
      expect(mockListener.onVehicleGetOffPassenger).toHaveBeenCalledTimes(1);
    });
  });
  describe('destroyVehicle', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `destroyVehicle test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should emit onVehicleDestroyed when player gets off a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.destroyVehicle(vehicleID);
      expect(mockListener.onVehicleDestroyed).toHaveBeenCalledTimes(1);
    });
  });
  describe('changeVehicleLockSituation', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `changeVehicleLockSituation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should switch to locked when driver locks the vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);
      expect(testingTown.vehicles[0].passengers.length).toBe(1);

      const vehicleID = testingTown.vehicles[0].id;
      expect(testingTown.vehicles[0].lock).toBe(false);
      testingTown.changeVehicleLockSituation(vehicleID);
      expect(testingTown.vehicles[0].lock).toBe(true);
    });
    it('should emit onVehicleChangeLockSituation when driver locks a vehicle', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const initLocation: VehicleLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
      const vehicleType  = 'Car';
      testingTown.createInitVehicle(player, initLocation, vehicleType);

      const vehicleID = testingTown.vehicles[0].id;
      testingTown.changeVehicleLockSituation(vehicleID);
      expect(mockListener.onVehicleChangeLockSituation).toHaveBeenCalledTimes(1);
    });
  });
});
