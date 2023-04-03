import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import Player from '../lib/Player';
import {
  Difficulty,
  BoundingBox,
  TownEmitter,
  DanceArea as DanceAreaModel,
  Arrow,
  ScoreObject,
  Display,
  ArrowDirection,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

const ARROWLENGTH = 20;
export default class DanceArea extends InteractableArea {
  // the difficulty selected; is an enum of easy, medium, and hard
  private _difficulty: Difficulty;

  // a list of correct arrows for this song
  private _correct: Arrow[];

  // list of user inputs
  private _userClicks: Arrow[];

  // a list of the highest score (10 objects)
  private _leaderboard: ScoreObject[];

  // a record of the score in this current dance area
  private _currentScore: ScoreObject;

  // timer for amount of time left in the current dance session
  private _timer: number;

  public get difficulty() {
    return this._difficulty;
  }

  public get correct() {
    return this._correct;
  }

  public get userClicks() {
    return this._userClicks;
  }

  public get leaderboard() {
    return this._leaderboard;
  }

  public get currentScore() {
    return this._currentScore;
  }

  public get timer() {
    return this._timer;
  }

  /**
   * Creates a new DanceArea
   *
   * @param viewingArea model containing this area's starting state
   * @param coordinates the bounding box that defines this viewing area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { id, difficulty, leaderboard, currentScore }: DanceAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._difficulty = difficulty || 15;
    this._leaderboard = leaderboard || new Array(10);
    this._correct = [];

    const directions: ArrowDirection[] = ['L', 'R', 'U', 'D'];
    const displays: Display[] = ['⇦', '⇨', '⇧', '⇩'];
    for (let i = 0; i < ARROWLENGTH; i++) {
      const direction: ArrowDirection = directions[Math.floor(Math.random() * directions.length)];
      const display: Display = displays[Math.floor(Math.random() * displays.length)];
      const duration = Math.floor(Math.random() * 10) + 1; // duration between 1 and 10
      this._correct.push({ display, direction, duration });
    }

    this._userClicks = [];
    this._currentScore = currentScore;
    this._timer = ARROWLENGTH * this._difficulty;
  }

  /**
   * Removes a player from this poster session area.
   *
   * When the last player leaves, this method clears the poster and title, and resets the number of stars, and emits this update to all players in the Town.
   *
   * @param player
   */
  public remove(player: Player): void {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._difficulty = 15;
      this._correct = [];
      this._userClicks = [];
      this._leaderboard = this.leaderboard;
      this._currentScore = { userId: '', score: 0 };
      this._timer = ARROWLENGTH * this._difficulty;
    }
    this._emitAreaChanged();
  }

  /**
   * Updates the state of this DanceAreaModel, setting the poster, title, and stars properties
   *
   * @param DanceAreaModel updated model
   */
  public updateModel(updatedModel: DanceAreaModel) {
    this._difficulty = updatedModel.difficulty;
    this._correct = updatedModel.correct;
    this._userClicks = updatedModel.userClicks;
    this._leaderboard = updatedModel.leaderboard;
    this._currentScore = updatedModel.currentScore;
    this._timer = updatedModel.timer;
  }

  public toModel(): DanceAreaModel {
    return {
      id: this.id,
      difficulty: this._difficulty,
      correct: this._correct,
      userClicks: this._userClicks,
      leaderboard: this._leaderboard,
      currentScore: this._currentScore,
      timer: this._timer,
    };
  }

  /**
   * Creates a new DanceArea object that will represent a DanceArea object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this viewing area exists
   * @param townEmitter An emitter that can be used by this viewing area to broadcast updates to players in the town
   * @returns
   */
  public static fromMapObject(mapObject: ITiledMapObject, townEmitter: TownEmitter): DanceArea {
    if (!mapObject.width || !mapObject.height) {
      throw new Error('missing width/height for map object');
    }
    const box = {
      x: mapObject.x,
      y: mapObject.y,
      width: mapObject.width,
      height: mapObject.height,
    };
    return new DanceArea(
      {
        id: mapObject.name,
        difficulty: 15,
        correct: [],
        userClicks: [],
        leaderboard: [],
        currentScore: { userId: '', score: 0 },
        timer: ARROWLENGTH * 15,
      },
      box,
      townEmitter,
    );
  }
}
