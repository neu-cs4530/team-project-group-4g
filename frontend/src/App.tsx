import { ChakraProvider } from '@chakra-ui/react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import assert from 'assert';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { BrowserRouter } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import './App.css';
import ConversationArea, { ServerConversationArea } from './classes/ConversationArea';
import Player, { ServerPlayer, UserLocation } from './classes/Player';
import Vehicle, { ServerVehicle, VehicleLocation } from './classes/Vehicle';
import TownsServiceClient, { TownJoinResponse } from './classes/TownsServiceClient';
import Video from './classes/Video/Video';
import Login from './components/Login/Login';
import { ChatProvider } from './components/VideoCall/VideoFrontend/components/ChatProvider';
import ErrorDialog from './components/VideoCall/VideoFrontend/components/ErrorDialog/ErrorDialog';
import UnsupportedBrowserWarning from './components/VideoCall/VideoFrontend/components/UnsupportedBrowserWarning/UnsupportedBrowserWarning';
import { VideoProvider } from './components/VideoCall/VideoFrontend/components/VideoProvider';
import AppStateProvider, { useAppState } from './components/VideoCall/VideoFrontend/state';
import theme from './components/VideoCall/VideoFrontend/theme';
import { Callback } from './components/VideoCall/VideoFrontend/types';
import useConnectionOptions from './components/VideoCall/VideoFrontend/utils/useConnectionOptions/useConnectionOptions';
import VideoOverlay from './components/VideoCall/VideoOverlay/VideoOverlay';
import WorldMap from './components/world/WorldMap';
import ConversationAreasContext from './contexts/ConversationAreasContext';
import CoveyAppContext from './contexts/CoveyAppContext';
import NearbyPlayersContext from './contexts/NearbyPlayersContext';
import PlayerMovementContext, { PlayerMovementCallback } from './contexts/PlayerMovementContext';
import VehicleMovementContext, { VehicleMovementCallback } from './contexts/VehicleMovementContext';
import PlayersInTownContext from './contexts/PlayersInTownContext';
import VehiclesInTownContext from './contexts/VehiclesInTownContext';
import VideoContext from './contexts/VideoContext';
import { CoveyAppState } from './CoveyTypes';

export const MOVEMENT_UPDATE_DELAY_MS = 0;
export const CALCULATE_NEARBY_PLAYERS_MOVING_DELAY_MS = 300;
type CoveyAppUpdate =
  | {
    action: 'doConnect';
    data: {
      userName: string;
      townFriendlyName: string;
      townID: string;
      townIsPubliclyListed: boolean;
      sessionToken: string;
      myPlayerID: string;
      socket: Socket;
      emitMovement: (location: UserLocation) => void;
      emitVehicleMovement: (location: VehicleLocation) => void;
      emitChangeVehicleLockSituation: (vehicleID: string) => void;
      emitDeleteVehicle: (vehicleID: string) => void;
      emitGetOffVehicle: (vehicleID: string) => void;
      emitCreateVehicle: (location: UserLocation, vehicleType: string) => void
      emitGetOnVehicle: (vehicleID: string) => void;
    };
  }
  | { action: 'disconnect' };

function defaultAppState(): CoveyAppState {
  return {
    myPlayerID: '',
    currentTownFriendlyName: '',
    currentTownID: '',
    currentTownIsPubliclyListed: false,
    sessionToken: '',
    userName: '',
    socket: null,
    emitMovement: () => { },
    emitVehicleMovement: () => { },
    emitChangeVehicleLockSituation: () => { },
    emitDeleteVehicle: () => { },
    emitGetOffVehicle: () => { },
    emitCreateVehicle: () => { },
    emitGetOnVehicle: () => { },
    apiClient: new TownsServiceClient(),
  };
}
function appStateReducer(state: CoveyAppState, update: CoveyAppUpdate): CoveyAppState {
  const nextState = {
    sessionToken: state.sessionToken,
    currentTownFriendlyName: state.currentTownFriendlyName,
    currentTownID: state.currentTownID,
    currentTownIsPubliclyListed: state.currentTownIsPubliclyListed,
    myPlayerID: state.myPlayerID,
    userName: state.userName,
    socket: state.socket,
    emitMovement: state.emitMovement,
    emitVehicleMovement: state.emitVehicleMovement,
    emitChangeVehicleLockSituation: state.emitChangeVehicleLockSituation,
    emitDeleteVehicle: state.emitDeleteVehicle,
    emitGetOffVehicle: state.emitGetOffVehicle,
    emitCreateVehicle: state.emitCreateVehicle,
    emitGetOnVehicle: state.emitGetOnVehicle,
    apiClient: state.apiClient,
  };

  switch (update.action) {
    case 'doConnect':
      nextState.sessionToken = update.data.sessionToken;
      nextState.myPlayerID = update.data.myPlayerID;
      nextState.currentTownFriendlyName = update.data.townFriendlyName;
      nextState.currentTownID = update.data.townID;
      nextState.currentTownIsPubliclyListed = update.data.townIsPubliclyListed;
      nextState.userName = update.data.userName;
      nextState.emitMovement = update.data.emitMovement;
      nextState.emitVehicleMovement = update.data.emitVehicleMovement;
      nextState.emitChangeVehicleLockSituation = update.data.emitChangeVehicleLockSituation;
      nextState.emitDeleteVehicle = update.data.emitDeleteVehicle;
      nextState.emitGetOffVehicle = update.data.emitGetOffVehicle;
      nextState.emitCreateVehicle = update.data.emitCreateVehicle;
      nextState.emitGetOnVehicle = update.data.emitGetOnVehicle;
      nextState.socket = update.data.socket;
      break;
    case 'disconnect':
      state.socket?.disconnect();
      return defaultAppState();
    default:
      throw new Error('Unexpected state request');
  }

  return nextState;
}

function calculateNearbyPlayers(players: Player[], currentLocation: UserLocation, gamePlayerID: string, localVehicles: Vehicle[]) {
  const isInSpecificVehicle = (p: Player, specificVehicle: Vehicle) => {
    if (specificVehicle.includesPassenger(p.id)) {
      return true;
    }
    return false;
  }

  let passengersIDList : string[] = [];
  for (let i = 0; i < localVehicles.length; i+=1) {
    const specificVehicle = localVehicles[i];
    if (!specificVehicle.includesPassenger(gamePlayerID)){
      // console.log('Not In The Car');
      // console.log(specificVehicle.gainAllPassengersID());
      passengersIDList = passengersIDList.concat(specificVehicle.gainAllPassengersID());
    } else {
      // console.log('In The Car');
      return players.filter(p => isInSpecificVehicle(p, specificVehicle));
    }
  }
  // console.log(passengersIDList);

  const isWithinCallRadius = (p: Player, location: UserLocation) => {
    // The passengers should not be called if gamePlayer is out of the specific vehicle.
    if (passengersIDList.includes(p.id)) {
      return false;
    }
    if (p.location && location) {
      if (location.conversationLabel || p.location.conversationLabel) {
        return p.location.conversationLabel === location.conversationLabel;
      }
      const dx = p.location.x - location.x;
      const dy = p.location.y - location.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      return d < 80;
    }
    return false;
  };
  return players.filter(p => isWithinCallRadius(p, currentLocation));
}
function samePlayers(a1: Player[], a2: Player[]) {
  if (a1.length !== a2.length) return false;
  const ids1 = a1.map(p => p.id).sort();
  const ids2 = a2.map(p => p.id).sort();
  return !ids1.some((val, idx) => val !== ids2[idx]);
}

function App(props: { setOnDisconnect: Dispatch<SetStateAction<Callback | undefined>> }) {
  const [appState, dispatchAppUpdate] = useReducer(appStateReducer, defaultAppState());
  const [playerMovementCallbacks] = useState<PlayerMovementCallback[]>([]);
  const [vehicleMovementCallbacks] = useState<VehicleMovementCallback[]>([]);
  const [playersInTown, setPlayersInTown] = useState<Player[]>([]);
  const [vehiclesInTown, setVehiclesInTown] = useState<Vehicle[]>([]);
  const [nearbyPlayers, setNearbyPlayers] = useState<Player[]>([]);
  // const [currentLocation, setCurrentLocation] = useState<UserLocation>({moving: false, rotation: 'front', x: 0, y: 0});
  const [conversationAreas, setConversationAreas] = useState<ConversationArea[]>([]);

  const setupGameController = useCallback(
    async (initData: TownJoinResponse) => {
      const gamePlayerID = initData.coveyUserID;
      const sessionToken = initData.coveySessionToken;
      const url = process.env.REACT_APP_TOWNS_SERVICE_URL;
      assert(url);
      const video = Video.instance();
      assert(video);
      const townName = video.townFriendlyName;
      assert(townName);

      const socket = io(url, { auth: { token: sessionToken, coveyTownID: video.coveyTownID } });
      socket.on('disconnect', () => {
        dispatchAppUpdate({ action: 'disconnect' });
      });
      let lastMovement = 0;
      let lastRecalculateNearbyPlayers = 0;
      let currentLocation: UserLocation = { moving: false, rotation: 'front', x: 0, y: 0 };

      let localPlayers = initData.currentPlayers.map(sp => Player.fromServerPlayer(sp));
      // Should modify to 'let' ranther 'const' later because we need to add and delete the vehicle later
      let localVehicles = initData.currentVehicles.map(sp => Vehicle.fromServerVehicle(sp));
      let localConversationAreas = initData.conversationAreas.map(sa =>
        ConversationArea.fromServerConversationArea(sa),
      );
      let localNearbyPlayers: Player[] = [];
      setPlayersInTown(localPlayers);
      setVehiclesInTown(localVehicles);
      setConversationAreas(localConversationAreas);
      setNearbyPlayers(localNearbyPlayers);

      const recalculateNearbyPlayers = () => {
        const newNearbyPlayers = calculateNearbyPlayers(localPlayers, currentLocation, gamePlayerID, localVehicles);
        if (!samePlayers(localNearbyPlayers, newNearbyPlayers)) {
          localNearbyPlayers = newNearbyPlayers;
          setNearbyPlayers(localNearbyPlayers);
        }
      };
      const emitMovement = (location: UserLocation) => {
        const now = Date.now();
        currentLocation = location;
        if (now - lastMovement > MOVEMENT_UPDATE_DELAY_MS || !location.moving) {
          lastMovement = now;
          socket.emit('playerMovement', location);
          if (
            now - lastRecalculateNearbyPlayers > CALCULATE_NEARBY_PLAYERS_MOVING_DELAY_MS ||
            !location.moving
          ) {
            lastRecalculateNearbyPlayers = now;
            recalculateNearbyPlayers();
          }
        }
      };

      const emitVehicleMovement = (location: VehicleLocation) => {
        // console.log(localPlayers);
        socket.emit('vehicleMovement', location);
      }

      const emitChangeVehicleLockSituation = (vehicleID: string) => {
        socket.emit('vehicleChangeLockSituation', vehicleID);
      }

      const emitDeleteVehicle = (vehicleID: string) => {
        socket.emit('destroyVehicle', vehicleID);
      }

      const emitGetOffVehicle = (vehicleID: string) => {
        // console.log('trigger');
        // console.log(vehicleID);
        socket.emit('getOffVehicle', vehicleID)
      }

      // Something like that
      const emitCreateVehicle = (location: UserLocation, vehicleType: string) => {
        socket.emit('newVehicle', location, vehicleType)
      };

      const emitGetOnVehicle = (vehicleID: string) => {
        socket.emit('getOnVehicle', vehicleID)
      }

      socket.on('newPlayer', (player: ServerPlayer) => {
        localPlayers = localPlayers.concat(Player.fromServerPlayer(player));
        setPlayersInTown(localPlayers);
        recalculateNearbyPlayers();
      });
      socket.on('VehicleCreated', (vehicle: ServerVehicle) => {
        localVehicles = localVehicles.concat(Vehicle.fromServerVehicle(vehicle));
        setVehiclesInTown(localVehicles);
      });
      socket.on('VehicleUpdatePassengers', (vehicle: ServerVehicle, passengerPlayer: ServerPlayer) => {
        // console.log(localPlayers);
        // for (let i = 1; i < localPlayers.length; i += 1){
        //   if (localPlayers[i].id === passengerPlayerID){
        //     localPlayers[i].visible = false;
        //   }
        // }
        // console.log(localPlayers);
        // setPlayersInTown(localPlayers)

        // for (let i = 1; i < localVehicles.length; i += 1){
        //   if (localVehicles[i].id === vehicle._id){
        //     localVehicles[i].passengers = vehicle._passengers;
        //   }
        // }
        // setVehiclesInTown(localVehicles);

        const updatedVehicle = localVehicles.find(v => v.id === vehicle._id);
        if (updatedVehicle) {
          updatedVehicle.passengers = vehicle._passengers;
          // console.log(updatedVehicle)
          setVehiclesInTown(localVehicles);
        } else {
          localVehicles = localVehicles.concat(Vehicle.fromServerVehicle(vehicle));
          setVehiclesInTown(localVehicles);
        }

        const updatedPlayer = localPlayers.find(p => p.id === passengerPlayer._id);
        if (updatedPlayer) {
          updatedPlayer.visible = false;
          // setPlayersInTown(localPlayers);
        } else {
          localPlayers = localPlayers.concat(Player.fromServerPlayer(passengerPlayer))
          setPlayersInTown(localPlayers);
        }


        // if ((localVehicles.find( v => v.id === vehicle._id)) && (localPlayers.find( p => p.id === passengerPlayerID))){
        //   (localVehicles.find( v => v.id === vehicle._id)).passengers = vehicle._passengers;
        //   passengerPlayer.visible = false;
        //   console.log(localPlayers);
        //   setPlayersInTown(localPlayers);
        //   setVehiclesInTown(localVehicles);
        //   console.log(localPlayers)
        // } else {
        //   throw new Error ('Did not find the vehicle || Did not find the passenger sPlayer');
        // }
      });

      socket.on('vehicleChangedLockSituation', (vehicle: ServerVehicle) => {
        const updateVehicle = localVehicles.find(v => v.id === vehicle._id);
        if(updateVehicle) {
          updateVehicle.lock = vehicle._lock;
        } else {
          localVehicles = localVehicles.concat(Vehicle.fromServerVehicle(vehicle));
          setVehiclesInTown(localVehicles);
        }
      });

      socket.on('VehicleGetOffPassengers', (vehicle: ServerVehicle, passengerPlayer: ServerPlayer) => {
        // console.log(passengerPlayer);
        const updatedVehicle = localVehicles.find(v => v.id === vehicle._id);
        if (updatedVehicle) {
          updatedVehicle.passengers = vehicle._passengers;
          // setVehiclesInTown(localVehicles);
        } else {
          localVehicles = localVehicles.concat(Vehicle.fromServerVehicle(vehicle));
          setVehiclesInTown(localVehicles);
        }

        if (passengerPlayer._id !== gamePlayerID) {
          const updatedPlayer = localPlayers.find(p => p.id === passengerPlayer._id);
          if (updatedPlayer) {
            updatedPlayer.visible = true;
            setPlayersInTown(localPlayers);
          } else {
            localPlayers = localPlayers.concat(Player.fromServerPlayer(passengerPlayer))
            setPlayersInTown(localPlayers);
          }
        }
      });

      socket.on('VehicleDestroyed', (vehicle: ServerVehicle, passengerPlayerList: ServerPlayer[]) => {
        for (let i = 0; i < passengerPlayerList.length; i += 1) {
          const updatedPlayer = localPlayers.find(p => p.id === passengerPlayerList[i]._id)
          if (updatedPlayer) {
            updatedPlayer.visible = true;
          } else {
            localPlayers = localPlayers.concat(Player.fromServerPlayer(passengerPlayerList[i]));
            setPlayersInTown(localPlayers);
          }
        }
        localVehicles = localVehicles.filter(v => v.id !== vehicle._id);
        setVehiclesInTown(localVehicles);


        // console.log(localPlayers);  
        // for (let i = 0; i < vehicle._passengers.length; i += 1) {
        //   // console.log(vehicle._passengers[i]);
        //   const passengerPlayerID = vehicle._passengers[i]._player._id;
        //   // console.log(passengerPlayerID);
        //   const updatedPlayer = localPlayers.find(p => p.id === passengerPlayerID);
        //   console.log(updatedPlayer);
        //   if (updatedPlayer) {
        //     updatedPlayer.visible = true;
        //   }
        // }
        // localVehicles = localVehicles.filter(v => v.id !== vehicle._id);
        // // const testUserLocation : UserLocation = {
        // //   x : 0,
        // //   y : 0,
        // //   rotation : 'front',
        // //   moving : true,
        // // };
        // // localPlayers.concat(new Player("test",'test', testUserLocation,));
        // console.log(localPlayers);
        // setPlayersInTown(localPlayers);
        // console.log(3)
        // setVehiclesInTown(localVehicles);
      });
      socket.on('playerMoved', (player: ServerPlayer) => {
        // if ((player._id !== gamePlayerID) || (player.visible === false)) {
        const now = Date.now();
        playerMovementCallbacks.forEach(cb => cb(player));
        if (
          !player.location.moving ||
          now - lastRecalculateNearbyPlayers > CALCULATE_NEARBY_PLAYERS_MOVING_DELAY_MS
        ) {
          lastRecalculateNearbyPlayers = now;
          const updatePlayer = localPlayers.find(p => p.id === player._id);
          if (updatePlayer) {
            updatePlayer.location = player.location;
          } else {
            localPlayers = localPlayers.concat(Player.fromServerPlayer(player));
            setPlayersInTown(localPlayers);
          }
          recalculateNearbyPlayers();
        }
        // }
      });
      socket.on('vehicleMoved', (vehicle: ServerVehicle) => {
        // if (vehicle !== gamePlayerID) {
        // const now = Date.now();
        vehicleMovementCallbacks.forEach(cb => cb(vehicle));
        if (
          !vehicle.location.moving
        ) {
          const updateVehicle = localVehicles.find(v => v.id === vehicle._id);
          if (updateVehicle) {
            updateVehicle.location = vehicle.location;
          } else {
            localVehicles = localVehicles.concat(Vehicle.fromServerVehicle(vehicle));
            setVehiclesInTown(localVehicles);
          }
        }
        // }
      })
      socket.on('playerInvisible', (player: ServerPlayer) => {
        if (player._id !== gamePlayerID) {
          const updatePlayer = localPlayers.find(p => p.id === player._id);
          if (updatePlayer) {
            updatePlayer.visible = false;
            setPlayersInTown(localPlayers);
            // console.log(localPlayers);
          } else {
            localPlayers = localPlayers.concat(Player.fromServerPlayer(player));
            setPlayersInTown(localPlayers);
            // console.log(localPlayers);
          }
        }
      });

      socket.on('playerVisible', (player: ServerPlayer) => {
        if (player._id !== gamePlayerID) {
          const updatePlayer = localPlayers.find(p => p.id === player._id);
          if (updatePlayer) {
            updatePlayer.visible = true;
            setPlayersInTown(localPlayers);
          } else {
            localPlayers = localPlayers.concat(Player.fromServerPlayer(player));
            setPlayersInTown(localPlayers);
          }
        }
      });



      // add vehicleMoved() here ...
      socket.on('playerDisconnect', (disconnectedPlayer: ServerPlayer) => {
        localPlayers = localPlayers.filter(player => player.id !== disconnectedPlayer._id);
        setPlayersInTown(localPlayers);
        recalculateNearbyPlayers();
      });
      socket.on('conversationUpdated', (_conversationArea: ServerConversationArea) => {
        const updatedConversationArea = localConversationAreas.find(
          c => c.label === _conversationArea.label,
        );
        if (updatedConversationArea) {
          updatedConversationArea.topic = _conversationArea.topic;
          updatedConversationArea.occupants = _conversationArea.occupantsByID;
        } else {
          localConversationAreas = localConversationAreas.concat([
            ConversationArea.fromServerConversationArea(_conversationArea),
          ]);
        }
        setConversationAreas(localConversationAreas);
        recalculateNearbyPlayers();
      });
      socket.on('conversationDestroyed', (_conversationArea: ServerConversationArea) => {
        const existingArea = localConversationAreas.find(a => a.label === _conversationArea.label);
        if (existingArea) {
          existingArea.topic = undefined;
          existingArea.occupants = [];
        }
        localConversationAreas = localConversationAreas.filter(a => a.label !== _conversationArea.label);
        setConversationAreas(localConversationAreas);
        recalculateNearbyPlayers();
      });
      dispatchAppUpdate({
        action: 'doConnect',
        data: {
          sessionToken,
          userName: video.userName,
          townFriendlyName: townName,
          townID: video.coveyTownID,
          myPlayerID: gamePlayerID,
          townIsPubliclyListed: video.isPubliclyListed,
          emitMovement,
          emitVehicleMovement,
          emitChangeVehicleLockSituation,
          emitDeleteVehicle,
          emitGetOffVehicle,
          emitCreateVehicle,
          emitGetOnVehicle,
          socket,
        },
      });

      return true;
    },
    [
      dispatchAppUpdate,
      playerMovementCallbacks,
      vehicleMovementCallbacks,
      setPlayersInTown,
      setVehiclesInTown,
      setNearbyPlayers,
      setConversationAreas,
    ],
  );
  const videoInstance = Video.instance();

  const { setOnDisconnect } = props;
  useEffect(() => {
    setOnDisconnect(() => async () => {
      // Here's a great gotcha: https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
      dispatchAppUpdate({ action: 'disconnect' });
      return Video.teardown();
    });
  }, [dispatchAppUpdate, setOnDisconnect]);

  const page = useMemo(() => {
    if (!appState.sessionToken) {
      return <Login doLogin={setupGameController} />;
    }
    if (!videoInstance) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        <WorldMap />
        <VideoOverlay preferredMode='fullwidth' />
      </div>
    );
  }, [setupGameController, appState.sessionToken, videoInstance]);

  return (
    <CoveyAppContext.Provider value={appState}>
      <VideoContext.Provider value={Video.instance()}>
        <ChatProvider>
          <PlayerMovementContext.Provider value={playerMovementCallbacks}>
            <PlayersInTownContext.Provider value={playersInTown}>
              <NearbyPlayersContext.Provider value={nearbyPlayers}>
                <VehicleMovementContext.Provider value={vehicleMovementCallbacks}>
                  <VehiclesInTownContext.Provider value={vehiclesInTown}>
                    <ConversationAreasContext.Provider value={conversationAreas}>
                      {page}
                    </ConversationAreasContext.Provider>
                  </VehiclesInTownContext.Provider>
                </VehicleMovementContext.Provider>
              </NearbyPlayersContext.Provider>
            </PlayersInTownContext.Provider>
          </PlayerMovementContext.Provider>
        </ChatProvider>
      </VideoContext.Provider>
    </CoveyAppContext.Provider>
  );
}

function EmbeddedTwilioAppWrapper() {
  const { error, setError } = useAppState();
  const [onDisconnect, setOnDisconnect] = useState<Callback | undefined>();
  const connectionOptions = useConnectionOptions();
  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError} onDisconnect={onDisconnect}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <App setOnDisconnect={setOnDisconnect} />
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
}

export default function AppStateWrapper(): JSX.Element {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <MuiThemeProvider theme={theme}>
          <AppStateProvider>
            <EmbeddedTwilioAppWrapper />
          </AppStateProvider>
        </MuiThemeProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
}
