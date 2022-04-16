// export enum PlayerType {
//   Human,
//   Car,
//   SkateBoard,
//   Dinasour,
// }

export default class Player {
  public location?: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  // // Might be useless in the later version. Do not use this field!
  // public playerType: PlayerType;

  public visible: boolean;

  constructor(id: string, userName: string, location: UserLocation, visible = true) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    // this.playerType = playerType;
    this.visible = visible;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  static fromServerPlayer(playerFromServer: ServerPlayer): Player {
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, playerFromServer.visible);
  }
}
export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, visible: boolean };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
  conversationLabel?: string 
};
