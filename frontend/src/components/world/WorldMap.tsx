import Phaser from 'phaser';
import React, { useEffect, useMemo, useState } from 'react';
import BoundingBox from '../../classes/BoundingBox';
import ConversationArea from '../../classes/ConversationArea';
import Player, { ServerPlayer, UserLocation } from '../../classes/Player';
import Vehicle, { ServerVehicle, VehicleLocation } from '../../classes/Vehicle';
import Video from '../../classes/Video/Video';
import useConversationAreas from '../../hooks/useConversationAreas';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayerMovement from '../../hooks/usePlayerMovement';
import useVehicleMovement from '../../hooks/useVehicleMovement';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import useVehiclesInTown from '../../hooks/useVehiclesInTown';
import SocialSidebar from '../SocialSidebar/SocialSidebar';
import { Callback } from '../VideoCall/VideoFrontend/types';
import NewConversationModal from './NewCoversationModal';

// Original inspiration and code from:
// https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6

type ConversationGameObjects = {
  labelText: Phaser.GameObjects.Text;
  topicText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  label: string;
  conversationArea?: ConversationArea;
};

type CarAreaGameObjects = {
  labelText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  label: string;
}

type SkateboardAreaGameObjects = {
  labelText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  label: string;
}

type DinosaurAreaGameObjects = {
  labelText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  label: string;
}

function getAtlasType(vehicle: Vehicle): string {
  let atlasType = 'car'
  switch (vehicle.vehicleType) {
    case 'Car':
      atlasType = 'car'
      break;
    case 'SkateBoard':
      atlasType = 'skateboard';
      break;
    case 'Dinosaur':
      atlasType = 'dinosaur';
      break;
    default:
      throw new Error('The AtlasType is undefined');
      break;
  }
  return atlasType;
}

function getAtlasName(vehicle: Vehicle): string {
  let atlasName = 'carAtlas';
  switch (vehicle.vehicleType) {
    case 'Car':
      atlasName = 'carAtlas';
      break;
    case 'SkateBoard':
      atlasName = 'skateboardAtlas';
      break;
    case 'Dinosaur':
      atlasName = 'dinosaurAtlas';
      break;
    default:
      throw new Error('The NameType is undefined');
      break;
  }
  return atlasName;
}

class CoveyGameScene extends Phaser.Scene {
  private player?: {
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    label: Phaser.GameObjects.Text;
  };

  // private vehicleSprite? : Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private myPlayerID: string;

  private players: Player[] = [];

  private vehicles: Vehicle[] = [];

  private conversationAreas: ConversationGameObjects[] = [];

  private carAreas: CarAreaGameObjects[] = [];

  private skateboardAreas: SkateboardAreaGameObjects[] = [];

  private dinosaurAreas: DinosaurAreaGameObjects[] = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys[] = [];

  private collideLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  /*
   * A "captured" key doesn't send events to the browser - they are trapped by Phaser
   * When pausing the game, we uncapture all keys, and when resuming, we re-capture them.
   * This is the list of keys that are currently captured by Phaser.
   */
  private previouslyCapturedKeys: number[] = [];

  private lastLocation?: UserLocation;

  private ready = false;

  private paused = false;

  private video: Video;

  private emitMovement: (loc: UserLocation) => void;

  private emitVehicleMovement: (loc: VehicleLocation) => void;

  private emitChangeVehicleLockSituation: (vehicleID: string) => void;

  private emitDeleteVehicle: (vehicleID: string) => void;

  private emitGetOffVehicle: (vehicleID: string) => void;

  private emitCreateVehicle: (loc: UserLocation, type: string) => void;

  private emitGetOnVehicle: (vehicleID: string) => void;

  private currentConversationArea?: ConversationGameObjects;

  private currentVehicleArea?: CarAreaGameObjects;

  private currentSkateboardArea?: SkateboardAreaGameObjects;

  private currentDinosaurArea?: DinosaurAreaGameObjects;

  private infoTextBox?: Phaser.GameObjects.Text;

  private infoTextBoxForVehicleArea?: Phaser.GameObjects.Text;

  private infoTextBoxForGetOnFailedDueCapacity?: Phaser.GameObjects.Text;

  private infoTextBoxForGetOnFailedDueLock?: Phaser.GameObjects.Text;

  private setNewConversation: (conv: ConversationArea) => void;

  private _onGameReadyListeners: Callback[] = [];


  constructor(
    video: Video,
    emitMovement: (loc: UserLocation) => void,
    emitVehicleMovement: (loc: VehicleLocation) => void,
    emitChangeVehicleLockSituation: (vehicleID: string) => void,
    emitDeleteVehicle: (vehicleID: string) => void,
    emitGetOffVehicle: (vehicleID: string) => void,
    emitCreateVehicle: (loc: UserLocation, type: string) => void,
    emitGetOnVehicle: (vehicleID: string) => void,
    setNewConversation: (conv: ConversationArea) => void,
    myPlayerID: string,
  ) {
    super('PlayGame');
    this.video = video;
    this.emitMovement = emitMovement;
    this.emitVehicleMovement = emitVehicleMovement;
    this.emitChangeVehicleLockSituation = emitChangeVehicleLockSituation;
    this.emitDeleteVehicle = emitDeleteVehicle;
    this.emitGetOffVehicle = emitGetOffVehicle;
    this.emitCreateVehicle = emitCreateVehicle;
    this.emitGetOnVehicle = emitGetOnVehicle;
    this.myPlayerID = myPlayerID;
    this.setNewConversation = setNewConversation;
  }

  preload() {
    // this.load.image("logo", logoImg);
    this.load.image('Room_Builder_32x32', '/assets/tilesets/Room_Builder_32x32.png');
    this.load.image('22_Museum_32x32', '/assets/tilesets/22_Museum_32x32.png');
    this.load.image(
      '5_Classroom_and_library_32x32',
      '/assets/tilesets/5_Classroom_and_library_32x32.png',
    );
    this.load.image('12_Kitchen_32x32', '/assets/tilesets/12_Kitchen_32x32.png');
    this.load.image('1_Generic_32x32', '/assets/tilesets/1_Generic_32x32.png');
    this.load.image('13_Conference_Hall_32x32', '/assets/tilesets/13_Conference_Hall_32x32.png');
    this.load.image('14_Basement_32x32', '/assets/tilesets/14_Basement_32x32.png');
    this.load.image('16_Grocery_store_32x32', '/assets/tilesets/16_Grocery_store_32x32.png');
    // this.load.image('parking_spot_32x32','/assets/tilesets/parking_spot_32x32.png');
    this.load.image('car_32x32', '/assets/tilesets/car_32x32.png');
    this.load.image('skateboard_32x32', '/assets/tilesets/skateboard_32x32.png')
    this.load.image('dinosaur_32x32', '/assets/tilesets/dinosaur_32x32.png')
    this.load.tilemapTiledJSON('map', '/assets/tilemaps/indoors.json');
    this.load.atlas('atlas', '/assets/atlas/atlas.png', '/assets/atlas/atlas.json');
    this.load.atlas('carAtlas', '/assets/carAtlas/atlas.png', '/assets/carAtlas/atlas.json');
    this.load.atlas('skateboardAtlas', '/assets/skateboardAtlas/atlas.png', '/assets/skateboardAtlas/atlas.json');
    this.load.atlas('dinosaurAtlas', '/assets/dinosaurAtlas/atlas.png', '/assets/dinosaurAtlas/atlas.json');
  }

  /**
   * Update the WorldMap's view of the current conversation areas, updating their topics and
   * participants, as necessary
   *
   * @param conversationAreas
   * @returns
   */
  updateConversationAreas(conversationAreas: ConversationArea[]) {
    if (!this.ready) {
      this._onGameReadyListeners.push(() => {
        this.updateConversationAreas(conversationAreas);
      });
      return;
    }
    conversationAreas.forEach(eachNewArea => {
      const existingArea = this.conversationAreas.find(area => area.label === eachNewArea.label);
      // TODO - if it becomes necessary to support new conversation areas (dynamically created), need to create sprites here to enable rendering on phaser
      // assert(existingArea);
      if (existingArea) {
        // assert(!existingArea.conversationArea);
        existingArea.conversationArea = eachNewArea;
        const updateListener = {
          onTopicChange: (newTopic: string | undefined) => {
            if (newTopic) {
              existingArea.topicText.text = newTopic;
            } else {
              existingArea.topicText.text = '(No topic)';
            }
          },
        };
        eachNewArea.addListener(updateListener);
        updateListener.onTopicChange(eachNewArea.topic);
      }
    });
    this.conversationAreas.forEach(eachArea => {
      const serverArea = conversationAreas?.find(a => a.label === eachArea.label);
      if (!serverArea) {
        eachArea.conversationArea = undefined;
      }
    });
  }

  updatePlayersLocations(players: Player[]) {
    if (!this.ready) {
      this.players = players;
      return;
    }
    players.forEach(p => {
      this.updatePlayerLocation(p);
    });
    // The following code do not affect the create and update of the sprite.
    // Remove disconnected players from board
    const disconnectedPlayers = this.players.filter(
      player => !players.find(p => p.id === player.id),
    );
    disconnectedPlayers.forEach(disconnectedPlayer => {
      if (disconnectedPlayer.sprite) {
        disconnectedPlayer.sprite.destroy();
        disconnectedPlayer.label?.destroy();
      }
    });
    // Remove disconnected players from list
    if (disconnectedPlayers.length) {
      this.players = this.players.filter(
        player => !disconnectedPlayers.find(p => p.id === player.id),
      );
    }
    // console.log(players);
  }

  updateVehiclesLocations(vehicles: Vehicle[]) {
    // console.log(vehicles)
    if (!this.ready) {
      this.vehicles = vehicles;
      return;
    }
    vehicles.forEach(v => {
      this.updateVehicleLocation(v);
    });
    // The following code do not affect the create and update of the sprite.
    // Remove disconnected Vehicles from board
    const disconnectedVehicles = this.vehicles.filter(
      vehicle => !vehicles.find(v => v.id === vehicle.id),
    );
    disconnectedVehicles.forEach(disconnectedVehicle => {
      if (disconnectedVehicle.sprite) {
        disconnectedVehicle.sprite.destroy();
        disconnectedVehicle.label?.destroy();
      }
    });
    // Remove disconnected players from list
    if (disconnectedVehicles.length) {
      this.vehicles = this.vehicles.filter(
        vehicle => !disconnectedVehicles.find(v => v.id === vehicle.id),
      );
    }
    // console.log(players);
  }

  updatePlayerLocation(player: Player) {
    // console.log(player)
    let myPlayer = this.players.find(p => p.id === player.id);
    if (!myPlayer) {
      let { location } = player;
      if (!location) {
        location = {
          rotation: 'back',
          moving: false,
          x: 0,
          y: 0,
        };
      }
      myPlayer = new Player(player.id, player.userName, location, player.visible);
      this.players.push(myPlayer);
    }
    // Update the visible field in the front end player list;
    myPlayer.visible = player.visible;

    if (this.myPlayerID !== myPlayer.id && this.physics && player.location) {
      let { sprite } = myPlayer;
      if (!sprite) {
        sprite = this.physics.add
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - JB todo
          .sprite(0, 0, 'atlas', `misa-${player.location.rotation}`)
          .setSize(30, 40)
          .setOffset(0, 24);
        const label = this.add.text(0, 0, myPlayer.userName, {
          font: '18px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        });
        myPlayer.label = label;
        myPlayer.sprite = sprite;
      }
      if (!sprite.anims) return;
      // console.log(sprite);
      sprite.setX(player.location.x);
      sprite.setY(player.location.y);
      myPlayer.label?.setX(player.location.x);
      myPlayer.label?.setY(player.location.y - 20);
      if (player.location.moving) {
        sprite.anims.play(`misa-${player.location.rotation}-walk`, true);
      } else {
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${player.location.rotation}`);
      }

      if (player.visible === false) {
        myPlayer.sprite?.setVisible(false);
        myPlayer.label?.setVisible(false);
      } else {
        myPlayer.sprite?.setVisible(true);
        myPlayer.label?.setVisible(true);
      }
    }

    // const myVehicle = this.vehicles.find(v => v.gainDriverID() === this.myPlayerID);

    if (this.myPlayerID === myPlayer.id && this.player?.sprite.visible === false && player.location && this.lastLocation) {
      // console.log(player.visible);
      this.player.sprite.x = player.location.x;
      this.player.sprite.y = player.location.y;
      this.lastLocation.x = player.location.x;
      this.lastLocation.y = player.location.y;
      if (player.visible === true) {
        // console.log('go there')
        this.player.sprite.setVisible(true);
        this.player.label.setVisible(true);
        myPlayer.visible = true;
      }
    }

  }

  updateVehicleLocation(vehicle: Vehicle) {
    // console.log(vehicle);
    let myVehicle = this.vehicles.find(v => v.id === vehicle.id);
    if (!myVehicle) {
      let { location } = vehicle;
      // Actually we mush have the updated vehicle location. Otherwise, it should be an Error. 
      // However, I would just give a default location here. 
      if (!location) {
        location = {
          rotation: 'back',
          moving: false,
          x: 0,
          y: 0,
        };
      }
      // Actually we mush have the updated passengers. Otherwise, it should be an Error. 
      // However, I would just give a default passengers here. 
      let { passengers } = vehicle;
      if (!passengers) {
        passengers = [];
      }

      myVehicle = new Vehicle(vehicle.id, vehicle.vehicleType, vehicle.capacity, vehicle.speed, location, passengers, vehicle.lock);
      this.vehicles.push(myVehicle);
      // console.log(this.vehicles);
    }
    // Actually we use this method to update the passenger list and the lock situation;
    myVehicle.passengers = vehicle.passengers;
    myVehicle.lock = vehicle.lock;
    // console.log(myVehicle.lock);

    // if (this.myPlayerID !== vehicle.gainDriverID() && this.physics && vehicle.location) {
    if (this.myPlayerID !== myVehicle.gainDriverID() && this.physics && vehicle.location) {
      let { sprite } = myVehicle;
      if (!sprite) {
        sprite = this.physics.add
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - JB todo
          // .sprite(0, 0, 'carAtlas', `car-${vehicle.location.rotation}`)
          .sprite(0, 0, getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-${vehicle.location.rotation}`)
        if (myVehicle.vehicleType === 'Car') {
          sprite
            .setScale(0.1)
            .setSize(10, 10)
        } else {
          sprite
            .setScale(1)
            .setSize(20, 20)
        }

        const label = this.add.text(0, 0, `Driver: ${vehicle.gainDriverUserName()}`, {
          font: '10px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        });
        myVehicle.label = label;
        myVehicle.sprite = sprite;

        const cursorKeys = this.input.keyboard.createCursorKeys();
        const myPlayer = this.players.find(p => p.id === this.myPlayerID);
        if (this.player && this.player.sprite && myPlayer) {
          this.physics.add.overlap(
            this.player.sprite,
            sprite,
            // (overlappingPlayer) => {
            ( ) => {
              if (cursorKeys.space.isDown) {
                if (this.player && myPlayer && myPlayer.visible === true && myVehicle && myVehicle.passengers) {
                  // if (myVehicle.passengers.length >= myVehicle.capacity) {
                  //   this.infoTextBoxForGetOnFailedDueCapacity?.setVisible(true);
                  // } else if (myVehicle.lock === true) {
                  //   this.infoTextBoxForGetOnFailedDueLock?.setVisible(true);
                  if (myVehicle.lock === true) {
                    this.infoTextBoxForGetOnFailedDueLock?.setVisible(true);
                  } else if (myVehicle.passengers.length >= myVehicle.capacity) {
                    this.infoTextBoxForGetOnFailedDueCapacity?.setVisible(true);
                  } else {
                    myPlayer.visible = false;
                    this.player.sprite.setVisible(false);
                    this.player.label.setVisible(false);
                    this.emitGetOnVehicle(myVehicle.id);
                  }
                }
              }
              if (myPlayer?.visible === true) {
                // this.infoTextBoxForVehicle?.setVisible(true);
              }
            },
          );
        }
      }
      if (vehicle.lock === true) {
        // console.log('VehicleLocked')
        myVehicle.label?.setText(`Driver: ${vehicle.gainDriverUserName()}\nLocked`)
      } else {
        // console.log('VehicleUnlocked')
        myVehicle.label?.setText(`Driver: ${vehicle.gainDriverUserName()}\nUnLocked`)
      }
      // console.log(myVehicle);


      if (!sprite.anims) return;
      // console.log(sprite);
      sprite.setX(vehicle.location.x);
      sprite.setY(vehicle.location.y);
      myVehicle.label?.setX(vehicle.location.x);
      myVehicle.label?.setY(vehicle.location.y - 20);
      if (vehicle.location.moving) {
        // sprite.anims.play(`car-${vehicle.location.rotation}-walk`, true);
        sprite.anims.play(`${getAtlasType(myVehicle)}-${vehicle.location.rotation}-walk`, true);
      } else {
        sprite.anims.stop();
        // sprite.setTexture('carAtlas', `car-${vehicle.location.rotation}`);
        sprite.setTexture(getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-${vehicle.location.rotation}`);
      }
    }

    if (this.myPlayerID === myVehicle.gainDriverID()) {
      this.player?.label.setText((`Driver: You\nLock: ${myVehicle.lock}`));
    }
  }

  getNewMovementDirection() {
    if (this.cursors.find(keySet => keySet.left?.isDown)) {
      return 'left';
    }
    if (this.cursors.find(keySet => keySet.right?.isDown)) {
      return 'right';
    }
    if (this.cursors.find(keySet => keySet.down?.isDown)) {
      return 'front';
    }
    if (this.cursors.find(keySet => keySet.up?.isDown)) {
      return 'back';
    }
    return undefined;
  }

  update() {
    if (this.paused) {
      return;
    }
    if (this.player && this.cursors) {
      const myPlayer = this.players.find(p => p.id === this.myPlayerID)
      const myVehicle = this.vehicles.find(v => v.gainDriverID() === this.myPlayerID);
      // Lock/Unlock the car
      if (myVehicle && myPlayer && myPlayer.visible === false && this.cursors.find(keySet => keySet.space?.isDown)) {
        this.emitChangeVehicleLockSituation(myVehicle.id);
      }

      if (myVehicle && myPlayer && myPlayer.visible === false && this.cursors.find(keySet => keySet.shift?.isDown)) {
        if (this.myPlayerID === myVehicle.gainDriverID()) {
          this.emitDeleteVehicle(myVehicle.id);
        }
        myPlayer.visible = true;
        this.player.sprite
          .setTexture('atlas', `misa-${this.lastLocation?.rotation}`)
          .setScale(1)
          .setSize(30, 40)
        this.player.sprite.setVisible(true);
        this.player.label.setText('You');
        // this.infoTextBoxForLockNotification?.setVisible(false);
        // this.infoTextBoxForUnLockNotification?.setVisible(false);
      };

      if (!myVehicle && myPlayer && myPlayer.visible === false && this.player.sprite.visible === false && this.cursors.find(keySet => keySet.shift?.isDown)) {
        // console.log('Should log this when the passenger get off the car')
        // console.log(this.vehicles)
        const vehicleAsPassenger = this.vehicles.find(v => v.includesPassenger(this.myPlayerID));
        // console.log(vehicleAsPassenger)
        if (vehicleAsPassenger) {
          this.emitGetOffVehicle(vehicleAsPassenger.id);
        }
        myPlayer.visible = true;
        this.player.sprite
          .setTexture('atlas', `misa-${this.lastLocation?.rotation}`)
          .setScale(1)
          .setSize(30, 40)
        this.player.sprite.setVisible(true);
        this.player.label.setVisible(true);
        // this.infoTextBoxForLockNotification?.setVisible(false);
        // this.infoTextBoxForUnLockNotification?.setVisible(false);
      };


      let speed = 175;
      if (myPlayer?.visible === false && myVehicle) {
        speed *= myVehicle.speed;
      }

      if (myPlayer?.visible === false && !myVehicle) {
        speed = 0;
      }

      if ((myPlayer?.visible === true) || myVehicle) {
        const prevVelocity = this.player.sprite.body.velocity.clone();
        const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;

        // Stop any previous movement from the last frame
        body.setVelocity(0);

        const primaryDirection = this.getNewMovementDirection();
        switch (primaryDirection) {
          case 'left':
            body.setVelocityX(-speed);
            if (myPlayer?.visible === true) {
              this.player.sprite.anims.play('misa-left-walk', true);
            } else {
              // this.player.sprite.anims.play('car-left-walk', true);
              if (myVehicle) { this.player.sprite.anims.play(`${getAtlasType(myVehicle)}-left-walk`, true) };
            }
            break;
          case 'right':
            body.setVelocityX(speed);
            if (myPlayer?.visible === true) {
              this.player.sprite.anims.play('misa-right-walk', true);
            } else {
              // this.player.sprite.anims.play('car-right-walk', true);
              if (myVehicle) { this.player.sprite.anims.play(`${getAtlasType(myVehicle)}-right-walk`, true) };
            }
            break;
          case 'front':
            body.setVelocityY(speed);
            if (myPlayer?.visible === true) {
              this.player.sprite.anims.play('misa-front-walk', true);
            } else {
              // this.player.sprite.anims.play('car-front-walk', true);
              if (myVehicle) { this.player.sprite.anims.play(`${getAtlasType(myVehicle)}-front-walk`, true) };
            }
            break;
          case 'back':
            body.setVelocityY(-speed);
            if (myPlayer?.visible === true) {
              this.player.sprite.anims.play('misa-back-walk', true);
            } else {
              // this.player.sprite.anims.play('car-back-walk', true);
              if (myVehicle) { this.player.sprite.anims.play(`${getAtlasType(myVehicle)}-back-walk`, true) };
            }
            break;
          default:
            // Not moving
            this.player.sprite.anims.stop();
            // If we were moving, pick and idle frame to use
            if (prevVelocity.x < 0) {
              if (myPlayer?.visible === true) {
                this.player.sprite.setTexture('atlas', 'misa-left');
              } else {
                // this.player.sprite.setTexture('carAtlas', 'car-left');
                if (myVehicle) { this.player.sprite.setTexture(getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-left`) };
              }
            } else if (prevVelocity.x > 0) {
              if (myPlayer?.visible === true) {
                this.player.sprite.setTexture('atlas', 'misa-right');
              } else {
                // this.player.sprite.setTexture('carAtlas', 'car-right');
                if (myVehicle) { this.player.sprite.setTexture(getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-right`) };
              }
            } else if (prevVelocity.y < 0) {
              if (myPlayer?.visible === true) {
                this.player.sprite.setTexture('atlas', 'misa-back');
              } else {
                // this.player.sprite.setTexture('carAtlas', 'car-back');
                if (myVehicle) { this.player.sprite.setTexture(getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-back`) };
              }
            } else if (prevVelocity.y > 0) {
              if (myPlayer?.visible === true) {
                this.player.sprite.setTexture('atlas', 'misa-front');
              } else {
                // this.player.sprite.setTexture('carAtlas', 'car-front');
                if (myVehicle) { this.player.sprite.setTexture(getAtlasName(myVehicle), `${getAtlasType(myVehicle)}-front`) };
              }
            }
            break;
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        this.player.sprite.body.velocity.normalize().scale(speed);

        const isMoving = primaryDirection !== undefined;
        this.player.label.setX(body.x);
        this.player.label.setY(body.y - 20);
        if (
          !this.lastLocation ||
          this.lastLocation.x !== (body.right + body.left) / 2 ||
          this.lastLocation.y !== (body.top + body.bottom) / 2 ||
          (isMoving && this.lastLocation.rotation !== primaryDirection) ||
          this.lastLocation.moving !== isMoving
        ) {
          if (!this.lastLocation) {
            this.lastLocation = {
              x: body.x,
              y: body.y,
              rotation: primaryDirection || 'front',
              moving: isMoving,
            };
          }
          this.lastLocation.x = (body.right + body.left) / 2;
          this.lastLocation.y = (body.top + body.bottom) / 2;
          this.lastLocation.rotation = primaryDirection || this.lastLocation.rotation || 'front';
          this.lastLocation.moving = isMoving;
          if (this.currentConversationArea) {
            if (this.currentConversationArea.conversationArea) {
              this.lastLocation.conversationLabel = this.currentConversationArea.label;
            }
            if (
              !Phaser.Geom.Rectangle.Overlaps(
                this.currentConversationArea.sprite.getBounds(),
                this.player.sprite.getBounds(),
              )
            ) {
              this.infoTextBox?.setVisible(false);
              this.currentConversationArea = undefined;
              this.lastLocation.conversationLabel = undefined;
            }
          }

          if (this.currentVehicleArea) {
            if (
              !Phaser.Geom.Rectangle.Overlaps(
                this.currentVehicleArea.sprite.getBounds(),
                this.player.sprite.getBounds(),
              )
            ) {
              this.infoTextBoxForVehicleArea?.setVisible(false);
            }
          }

          if (this.currentSkateboardArea) {
            if (
              !Phaser.Geom.Rectangle.Overlaps(
                this.currentSkateboardArea.sprite.getBounds(),
                this.player.sprite.getBounds(),
              )
            ) {
              this.infoTextBoxForVehicleArea?.setVisible(false);
            }
          }

          if (this.currentDinosaurArea) {
            if (
              !Phaser.Geom.Rectangle.Overlaps(
                this.currentDinosaurArea.sprite.getBounds(),
                this.player.sprite.getBounds(),
              )
            ) {
              this.infoTextBoxForVehicleArea?.setVisible(false);
            }
          }

          this.emitMovement(this.lastLocation);
          this.infoTextBoxForGetOnFailedDueCapacity?.setVisible(false);
          this.infoTextBoxForGetOnFailedDueLock?.setVisible(false);
          const vehicleLocation: VehicleLocation = {
            x: this.lastLocation.x,
            y: this.lastLocation.y,
            rotation: this.lastLocation.rotation,
            moving: this.lastLocation.moving
          }

          if (myPlayer?.visible === false) {
            this.emitVehicleMovement(vehicleLocation)
            // this.infoTextBoxForLockNotification?.setVisible(false);
            // this.infoTextBoxForUnLockNotification?.setVisible(false);
            // console.log(myVehicle);
          }
        }
      }
    }

  }

  create() {
    // console.log('create time');
    const map = this.make.tilemap({ key: 'map' });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the
     tileset image in Phaser's cache (i.e. the name you used in preload)
     */
    const tileset = [
      'Room_Builder_32x32',
      '22_Museum_32x32',
      '5_Classroom_and_library_32x32',
      '12_Kitchen_32x32',
      '1_Generic_32x32',
      '13_Conference_Hall_32x32',
      '14_Basement_32x32',
      '16_Grocery_store_32x32',
      'car_32x32',
      'skateboard_32x32',
      'dinosaur_32x32',
    ].map(v => map.addTilesetImage(v));

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const belowLayer = map.createLayer('Below Player', tileset, 0, 0);
    const wallsLayer = map.createLayer('Walls', tileset, 0, 0);
    const onTheWallsLayer = map.createLayer('On The Walls', tileset, 0, 0);
    wallsLayer.setCollisionByProperty({ collides: true });
    onTheWallsLayer.setCollisionByProperty({ collides: true });

    const worldLayer = map.createLayer('World', tileset, 0, 0);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = map.createLayer('Above Player', tileset, 0, 0);
    aboveLayer.setCollisionByProperty({ collides: true });

    const veryAboveLayer = map.createLayer('Very Above Player', tileset, 0, 0);
    /* By default, everything gets depth sorted on the screen in the order we created things.
     Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
     it a depth. Higher depths will sit on top of lower depth objects.
     */
    worldLayer.setDepth(5);
    aboveLayer.setDepth(10);
    veryAboveLayer.setDepth(15);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = (map.findObject(
      'Objects',
      obj => obj.name === 'Spawn Point',
    ) as unknown) as Phaser.GameObjects.Components.Transform;

    // Find all of the transporters, add them to the physics engine
    const transporters = map.createFromObjects('Objects', { name: 'transporter' });
    this.physics.world.enable(transporters);

    // For each of the transporters (rectangle objects), we need to tweak their location on the scene
    // for reasons that are not obvious to me, but this seems to work. We also set them to be invisible
    // but for debugging, you can comment out that line.
    transporters.forEach(transporter => {
      const sprite = transporter as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight; // Phaser and Tiled seem to disagree on which corner is y
      sprite.setVisible(false); // Comment this out to see the transporter rectangles drawn on
      // the map
    });

    const carAreaObject = map.filterObjects(
      'Objects',
      obj => obj.type === 'car_vehicle_area',
    );
    const carAreaSprites = map.createFromObjects(
      'Objects',
      carAreaObject.map(obj => ({ id: obj.id })),
    );
    this.physics.world.enable(carAreaSprites);
    carAreaSprites.forEach(carArea => {
      const sprite = carArea as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight;
      const labelText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y - sprite.displayHeight / 2,
        carArea.name,
        { color: '#FFFFFF', backgroundColor: '#000000' },
      );
      sprite.setTintFill();
      sprite.setAlpha(0.3);

      this.carAreas.push({
        labelText,
        sprite,
        label: carArea.name,
      });
    });

    const skateboardAreaObject = map.filterObjects(
      'Objects',
      obj => obj.type === 'skateboard_vehicle_area',
    );
    const skateboardAreaSprites = map.createFromObjects(
      'Objects',
      skateboardAreaObject.map(obj => ({ id: obj.id })),
    );
    this.physics.world.enable(skateboardAreaSprites);
    skateboardAreaSprites.forEach(skateboardArea => {
      const sprite = skateboardArea as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight;
      const labelText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y - sprite.displayHeight / 2,
        skateboardArea.name,
        { color: '#FFFFFF', backgroundColor: '#000000' },
      );
      sprite.setTintFill();
      sprite.setAlpha(0.3);

      this.skateboardAreas.push({
        labelText,
        sprite,
        label: skateboardArea.name,
      });
    });

    const dinosaurAreaObject = map.filterObjects(
      'Objects',
      obj => obj.type === 'dinosaur_vehicle_area',
    );
    const dinosaurAreaSprites = map.createFromObjects(
      'Objects',
      dinosaurAreaObject.map(obj => ({ id: obj.id })),
    );
    this.physics.world.enable(dinosaurAreaSprites);
    dinosaurAreaSprites.forEach(dinosaurArea => {
      const sprite = dinosaurArea as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight;
      const labelText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y - sprite.displayHeight / 2,
        dinosaurArea.name,
        { color: '#FFFFFF', backgroundColor: '#000000' },
      );
      sprite.setTintFill();
      sprite.setAlpha(0.3);

      this.dinosaurAreas.push({
        labelText,
        sprite,
        label: dinosaurArea.name,
      });
    });

    this.infoTextBoxForVehicleArea = this.add
      .text(
        this.game.scale.width / 2,
        this.game.scale.height / 2,
        "You've found area to gain the vehicle!\nGain a new vehicle by pressing the spacebar.",
        { color: '#000000', backgroundColor: '#FFFFFF' },
      )
      .setScrollFactor(0)
      .setDepth(30);
    this.infoTextBoxForVehicleArea.setVisible(false);
    this.infoTextBoxForVehicleArea.x = this.game.scale.width / 2 - this.infoTextBoxForVehicleArea.width / 2;

    this.infoTextBoxForGetOnFailedDueCapacity = this.add
      .text(
        this.game.scale.width / 2,
        this.game.scale.height / 2,
        "You Could Not Get On the Vehicle With Full Passengers!\nJust Move to let the notification disappear.",
        { color: '#000000', backgroundColor: '#FFFFFF' },
      )
      .setScrollFactor(0)
      .setDepth(30);
    this.infoTextBoxForGetOnFailedDueCapacity.setVisible(false);
    this.infoTextBoxForGetOnFailedDueCapacity.x = this.game.scale.width / 2 - this.infoTextBoxForGetOnFailedDueCapacity.width / 2;

    this.infoTextBoxForGetOnFailedDueLock = this.add
      .text(
        this.game.scale.width / 2,
        this.game.scale.height / 2,
        "You Could Not Get On the Locked Vehicle!\nJust Move to let the notification disappear.",
        { color: '#000000', backgroundColor: '#FFFFFF' },
      )
      .setScrollFactor(0)
      .setDepth(30);
    this.infoTextBoxForGetOnFailedDueLock.setVisible(false);
    this.infoTextBoxForGetOnFailedDueLock.x = this.game.scale.width / 2 - this.infoTextBoxForGetOnFailedDueLock.width / 2;

    const conversationAreaObjects = map.filterObjects(
      'Objects',
      obj => obj.type === 'conversation',
    );
    const conversationSprites = map.createFromObjects(
      'Objects',
      conversationAreaObjects.map(obj => ({ id: obj.id })),
    );
    this.physics.world.enable(conversationSprites);
    conversationSprites.forEach(conversation => {
      const sprite = conversation as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight;
      const labelText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y - sprite.displayHeight / 2,
        conversation.name,
        { color: '#FFFFFF', backgroundColor: '#000000' },
      );
      const topicText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y + sprite.displayHeight / 2,
        '(No Topic)',
        { color: '#000000' },
      );
      sprite.setTintFill();
      sprite.setAlpha(0.3);

      this.conversationAreas.push({
        labelText,
        topicText,
        sprite,
        label: conversation.name,
      });
    });

    this.infoTextBox = this.add
      .text(
        this.game.scale.width / 2,
        this.game.scale.height / 2,
        "You've found an empty conversation area!\nTell others what you'd like to talk about here\nby providing a topic label for the conversation.\nSpecify a topic by pressing the spacebar.",
        { color: '#000000', backgroundColor: '#FFFFFF' },
      )
      .setScrollFactor(0)
      .setDepth(30);
    this.infoTextBox.setVisible(false);
    this.infoTextBox.x = this.game.scale.width / 2 - this.infoTextBox.width / 2;

    const labels = map.filterObjects('Objects', obj => obj.name === 'label');
    labels.forEach(label => {
      if (label.x && label.y) {
        this.add.text(label.x, label.y, label.text.text, {
          color: '#FFFFFF',
          backgroundColor: '#000000',
        });
      }
    });

    const cursorKeys = this.input.keyboard.createCursorKeys();
    this.cursors.push(cursorKeys);
    this.cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
          // getOffVehicle: Phaser.Input.Keyboard.KeyCodes.F,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );
    this.cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.H,
          down: Phaser.Input.Keyboard.KeyCodes.J,
          left: Phaser.Input.Keyboard.KeyCodes.K,
          right: Phaser.Input.Keyboard.KeyCodes.L,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );

    // Create a sprite with physics enabled via the physics system. The image used for the sprite
    // has a bit of whitespace, so I'm using setSize & setOffset to control the size of the
    // player's body.
    const sprite = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, 'atlas', `misa-front`)
      .setSize(30, 40)
      .setOffset(0, 24);
    // .setScale(0.1)
    // .setSize(10, 10)
    // .setOffset(0,0);
    const label = this.add.text(spawnPoint.x, spawnPoint.y - 20, '(You)', {
      font: '10px monospace',
      color: '#000000',
      // padding: {x: 20, y: 10},
      backgroundColor: '#ffffff',
    });
    this.player = {
      sprite,
      label,
    };

    /* Configure physics overlap behavior for when the player steps into
    a transporter area. If you enter a transporter and press 'space', you'll
    transport to the location on the map that is referenced by the 'target' property
    of the transporter.
     */
    this.physics.add.overlap(sprite, transporters, (overlappingObject, transporter) => {
      if (this.player) {
        // In the tiled editor, set the 'target' to be an *object* pointer
        // Here, we'll see just the ID, then find the object by ID
        const transportTargetID = transporter.getData('target') as number;
        const target = map.findObject(
          'Objects',
          obj => ((obj as unknown) as Phaser.Types.Tilemaps.TiledObject).id === transportTargetID,
        );
        if (target && target.x && target.y && this.lastLocation) {
          // Move the player to the target, update lastLocation and send it to other players
          this.player.sprite.x = target.x;
          this.player.sprite.y = target.y;
          this.lastLocation.x = target.x;
          this.lastLocation.y = target.y;
          this.emitMovement(this.lastLocation);
        } else {
          throw new Error(`Unable to find target object ${target}`);
        }
      }
    });
    this.physics.add.overlap(
      sprite,
      conversationSprites,
      (overlappingPlayer, conversationSprite) => {
        const conversationLabel = conversationSprite.name;
        const conv = this.conversationAreas.find(area => area.label === conversationLabel);
        this.currentConversationArea = conv;
        if (conv?.conversationArea) {
          this.infoTextBox?.setVisible(false);
          const localLastLocation = this.lastLocation;
          if (localLastLocation && localLastLocation.conversationLabel !== conv.conversationArea.label) {
            localLastLocation.conversationLabel = conv.conversationArea.label;
            this.emitMovement(localLastLocation);
          }
        } else {
          if (cursorKeys.space.isDown) {
            const newConversation = new ConversationArea(
              conversationLabel,
              BoundingBox.fromSprite(conversationSprite as Phaser.GameObjects.Sprite),
            );
            this.setNewConversation(newConversation);
          }
          this.infoTextBox?.setVisible(true && this.player?.sprite.visible === true);
        }
      },
    );

    this.physics.add.overlap(
      sprite,
      carAreaSprites,
      (overlappingPlayer, carAreaSprite) => {
        const carAreaLabel = carAreaSprite.name;
        const carArea = this.carAreas.find(area => area.label === carAreaLabel);
        this.currentVehicleArea = carArea;
        const myPlayer = this.players.find(p => p.id === this.myPlayerID);
        if (cursorKeys.space.isDown) {
          if (this.player && this.lastLocation && myPlayer && myPlayer.visible === true && myPlayer.location) {
            myPlayer.visible = false;
            this.emitCreateVehicle(this.lastLocation, 'Car');
            this.player.sprite
              .setTexture('carAtlas', `car-${myPlayer.location.rotation}`)
              .setScale(0.1)
              .setSize(10, 10)
          }
        }
        this.infoTextBoxForVehicleArea?.setVisible(true && this.player?.sprite.visible === true);
      },
    );

    this.physics.add.overlap(
      sprite,
      skateboardAreaSprites,
      (overlappingPlayer, skateboardAreaSprite) => {
        const skateboardAreaLabel = skateboardAreaSprite.name;
        const skateboardArea = this.skateboardAreas.find(area => area.label === skateboardAreaLabel);
        this.currentSkateboardArea = skateboardArea;
        const myPlayer = this.players.find(p => p.id === this.myPlayerID);
        if (cursorKeys.space.isDown) {
          if (this.player && this.lastLocation && myPlayer && myPlayer.visible === true && myPlayer.location) {
            myPlayer.visible = false;
            this.emitCreateVehicle(this.lastLocation, 'SkateBoard');
            this.player.sprite
              .setTexture('skateboardAtlas', `skateboard-${myPlayer.location.rotation}`)
              .setScale(1)
              .setSize(20, 20)
          }
        }
        this.infoTextBoxForVehicleArea?.setVisible(true && this.player?.sprite.visible === true);
      },
    );

    this.physics.add.overlap(
      sprite,
      dinosaurAreaSprites,
      (overlappingPlayer, dinosaurAreaSprite) => {
        const dinosaurAreaLabel = dinosaurAreaSprite.name;
        const dinosaurArea = this.dinosaurAreas.find(area => area.label === dinosaurAreaLabel);
        this.currentDinosaurArea = dinosaurArea;
        const myPlayer = this.players.find(p => p.id === this.myPlayerID);
        if (cursorKeys.space.isDown) {
          if (this.player && this.lastLocation && myPlayer && myPlayer.visible === true && myPlayer.location) {
            myPlayer.visible = false;
            this.emitCreateVehicle(this.lastLocation, 'Dinosaur');
            this.player.sprite
              .setTexture('dinosaurAtlas', `dinosaur-${myPlayer.location.rotation}`)
              .setScale(1)
              .setSize(20, 20)
          }
        }
        this.infoTextBoxForVehicleArea?.setVisible(true && this.player?.sprite.visible === true);
      },
    );

    this.emitMovement({
      rotation: 'front',
      moving: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - JB todo
      x: spawnPoint.x,
      y: spawnPoint.y,
    });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(sprite, worldLayer);
    this.collideLayers.push(worldLayer);
    this.physics.add.collider(sprite, wallsLayer);
    this.collideLayers.push(wallsLayer);
    this.physics.add.collider(sprite, aboveLayer);
    this.collideLayers.push(aboveLayer);
    this.physics.add.collider(sprite, onTheWallsLayer);
    this.collideLayers.push(onTheWallsLayer);

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const { anims } = this;
    anims.create({
      key: 'misa-left-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-right-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-front-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-back-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'car-left-walk',
      frames: anims.generateFrameNames('carAtlas', {
        prefix: 'car-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'car-right-walk',
      frames: anims.generateFrameNames('carAtlas', {
        prefix: 'car-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'car-front-walk',
      frames: anims.generateFrameNames('carAtlas', {
        prefix: 'car-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'car-back-walk',
      frames: anims.generateFrameNames('carAtlas', {
        prefix: 'car-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'skateboard-left-walk',
      frames: anims.generateFrameNames('skateboardAtlas', {
        prefix: 'skateboard-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'skateboard-right-walk',
      frames: anims.generateFrameNames('skateboardAtlas', {
        prefix: 'skateboard-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'skateboard-front-walk',
      frames: anims.generateFrameNames('skateboardAtlas', {
        prefix: 'skateboard-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'skateboard-back-walk',
      frames: anims.generateFrameNames('skateboardAtlas', {
        prefix: 'skateboard-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'dinosaur-left-walk',
      frames: anims.generateFrameNames('dinosaurAtlas', {
        prefix: 'dinosaur-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'dinosaur-right-walk',
      frames: anims.generateFrameNames('dinosaurAtlas', {
        prefix: 'dinosaur-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'dinosaur-front-walk',
      frames: anims.generateFrameNames('dinosaurAtlas', {
        prefix: 'dinosaur-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'dinosaur-back-walk',
      frames: anims.generateFrameNames('dinosaurAtlas', {
        prefix: 'dinosaur-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(
        16,
        16,
        `Arrow keys to move`,
        {
          font: '16px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.add
      .text(
        16,
        56,
        `Find a parking area to start private conversation`,
        {
          font: '16px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.add
      .text(
        16,
        96,
        `Space key to add/enter a vehicle`,
        {
          font: '16px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.add
      .text(
        16,
        136,
        `Space key to lock/unlock a vehicle`,
        {
          font: '16px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.add
      .text(
        16,
        176,
        `Shift key to leave a vehicle`,
        {
          font: '16px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.ready = true;
    if (this.players.length) {
      // Some players got added to the queue before we were ready, make sure that they have
      // sprites....
      this.players.forEach(p => this.updatePlayerLocation(p));
    }
    if (this.vehicles.length) {
      // Some vehicles got added to the queue before we were ready, make sure that they have
      // sprites....
      this.vehicles.forEach(v => this.updateVehicleLocation(v));
    }
    // Call any listeners that are waiting for the game to be initialized
    this._onGameReadyListeners.forEach(listener => listener());
    this._onGameReadyListeners = [];
  }

  pause() {
    if (!this.paused) {
      this.paused = true;
      if (this.player) {
        this.player?.sprite.anims.stop();
        const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
      }
      this.previouslyCapturedKeys = this.input.keyboard.getCaptures();
      this.input.keyboard.clearCaptures();
    }
  }

  resume() {
    if (this.paused) {
      this.paused = false;
      if (Video.instance()) {
        // If the game is also in process of being torn down, the keyboard could be undefined
        this.input.keyboard.addCapture(this.previouslyCapturedKeys);
      }
      this.previouslyCapturedKeys = [];
    }
  }
}

export default function WorldMap(): JSX.Element {
  const video = Video.instance();
  const { emitMovement, emitCreateVehicle, emitGetOnVehicle, emitVehicleMovement, emitChangeVehicleLockSituation, emitDeleteVehicle, emitGetOffVehicle, myPlayerID } = useCoveyAppState();
  const conversationAreas = useConversationAreas();
  const [gameScene, setGameScene] = useState<CoveyGameScene>();
  const [newConversation, setNewConversation] = useState<ConversationArea>();
  const playerMovementCallbacks = usePlayerMovement();
  const vehicleMovementCallbacks = useVehicleMovement();
  const players = usePlayersInTown();
  const vehicles = useVehiclesInTown();
  // console.log(players);
  // console.log(vehicles);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: 'map-container',
      pixelArt: true,
      autoRound: 10,
      minWidth: 800,
      fps: { target: 30 },
      powerPreference: 'high-performance',
      minHeight: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
    };

    const game = new Phaser.Game(config);
    if (video) {
      const newGameScene = new CoveyGameScene(video, emitMovement, emitVehicleMovement, emitChangeVehicleLockSituation, emitDeleteVehicle, emitGetOffVehicle, emitCreateVehicle, emitGetOnVehicle, setNewConversation, myPlayerID);
      setGameScene(newGameScene);
      game.scene.add('coveyBoard', newGameScene, true);
      video.pauseGame = () => {
        newGameScene.pause();
      };
      video.unPauseGame = () => {
        newGameScene.resume();
      };
    }
    return () => {
      game.destroy(true);
    };
  }, [video, emitMovement, emitVehicleMovement, emitChangeVehicleLockSituation, emitDeleteVehicle, emitGetOffVehicle, emitCreateVehicle, emitGetOnVehicle, setNewConversation, myPlayerID]);

  // This side Effect does not influence the create stage.
  // This Side Effect only affect the movement of the Player during animation.
  useEffect(() => {
    const movementDispatcher = (player: ServerPlayer) => {
      gameScene?.updatePlayerLocation(Player.fromServerPlayer(player));
    };
    playerMovementCallbacks.push(movementDispatcher);
    return () => {
      playerMovementCallbacks.splice(playerMovementCallbacks.indexOf(movementDispatcher), 1);
    };
  }, [gameScene, playerMovementCallbacks]);


  useEffect(() => {
    const movementDispatcher = (vehicle: ServerVehicle) => {
      gameScene?.updateVehicleLocation(Vehicle.fromServerVehicle(vehicle));
    };
    vehicleMovementCallbacks.push(movementDispatcher);
    return () => {
      vehicleMovementCallbacks.splice(vehicleMovementCallbacks.indexOf(movementDispatcher), 1);
    };
  }, [gameScene, vehicleMovementCallbacks]);

  // When the town create, create the Player sprite according to the player list.
  // When the players list update, modify the Player sprite accordingly. 
  useEffect(() => {
    gameScene?.updatePlayersLocations(players);
  }, [gameScene, players]);

  useEffect(() => {
    gameScene?.updateVehiclesLocations(vehicles);
  }, [gameScene, vehicles]);

  useEffect(() => {
    gameScene?.updateConversationAreas(conversationAreas);
  }, [conversationAreas, gameScene]);

  const newConversationModalOpen = newConversation !== undefined;
  useEffect(() => {
    if (newConversationModalOpen) {
      video?.pauseGame();
    } else {
      video?.unPauseGame();
    }
  }, [video, newConversationModalOpen]);

  const newConversationModal = useMemo(() => {
    if (newConversation) {
      video?.pauseGame();
      return (
        <NewConversationModal
          isOpen={newConversation !== undefined}
          closeModal={() => {
            video?.unPauseGame();
            setNewConversation(undefined);
          }}
          newConversation={newConversation}
        />
      );
    }
    return <></>;
  }, [video, newConversation, setNewConversation]);

  return (
    <div id='app-container'>
      {newConversationModal}
      <div id='map-container' />
      <div id='social-container'>
        <SocialSidebar />
      </div>
    </div>
  );
}
