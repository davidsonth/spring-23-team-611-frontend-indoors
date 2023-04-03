import { EventEmitter } from 'events';
import TypedEventEmitter from 'typed-emitter';
import { Arrow, DanceArea as DanceAreaModel, Difficulty, ScoreObject } from '../types/CoveyTownSocket';

/**
 * The events that a ViewingAreaController can emit
 */
export type DanceAreaEvents = {
  /**
   * A playbackChange event indicates that the playing/paused state has changed.
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  difficultyChange: (difficulty: Difficulty) => void;
  /**
   * A progressChange event indicates that the progress of the video has changed, either
   * due to the user scrubbing through the video, or from the natural progression of time.
   * Listeners are passed the new playback time elapsed in seconds.
   */
  currentScoreChange: (currentScore: ScoreObject) => void;
  /**
   * A videoChange event indicates that the video selected for this viewing area has changed.
   * Listeners are passed the new video, which is either a string (the URL to a video), or
   * the value `undefined` to indicate that there is no video set.
   */
  timerChange: (timer: number | undefined) => void;

  correctChange: (correct: Arrow[] | undefined) => void;

  userClicksChange: (userClicks: Arrow[] | undefined) => void;

  leaderboardChange: (leaderboard: ScoreObject[] | undefined) => void;


};

/**
 * A ViewingAreaController manages the state for a ViewingArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The ViewingAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see ViewingAreaEvents
 */
export default class DanceAreaController extends (EventEmitter as new () => TypedEventEmitter<DanceAreaEvents>) {
  private _model: DanceAreaModel;

  /**
   * Constructs a new ViewingAreaController, initialized with the state of the
   * provided viewingAreaModel.
   *
   * @param viewingAreaModel The viewing area model that this controller should represent
   */
  constructor(danceAreaModel: DanceAreaModel) {
    super();
    this._model = danceAreaModel;
  }

  /**
   * The ID of the viewing area represented by this viewing area controller
   * This property is read-only: once a ViewingAreaController is created, it will always be
   * tied to the same viewing area ID.
   */
  public get id() {
    return this._model.id;
  }

  /**
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
   */
  public get defficulty() {
    return this._model.difficulty;
  }

  /**
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
   *
   * Changing this value will emit a 'videoChange' event to listeners
   */
  public set difficulty(difficulty: Difficulty) {
    if (this._model.difficulty !== difficulty) {
      this._model.difficulty = difficulty;
      this.emit('difficultyChange', difficulty);
    }
  }

  /**
   * The playback position of the video, in seconds (a floating point number)
   */
  public get timer() {
    return this._model.timer;
  }

  /**
   * The playback position of the video, in seconds (a floating point number)
   *
   * Changing this value will emit a 'progressChange' event to listeners
   */
  public set timer(timer: number) {
    if (this._model.timer != timer) {
      this._model.timer = timer;
      this.emit('timerChange', timer);
    }
  }

  /**
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   */
  public get currentScore() {
    return this._model.currentScore;
  }

  /**
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   *
   * Changing this value will emit a 'playbackChange' event to listeners
   */
  public set currentScore(currentScore: ScoreObject) {
    if (this._model.currentScore != this.currentScore) {
      this._model.currentScore = currentScore;
      this.emit('currentScoreChange', currentScore);
    }
  }

  public get correct(){
    return this._model.correct;
  }

  public set correct(correct: Arrow[]) {
    if (this._model.correct != this.correct) {
      this._model.correct = correct;
      this.emit('correctChange', correct);
    }
  }

  public get userClicks(){
    return this._model.userClicks;
  }

  public set userClicks(userClicks: Arrow[]) {
    if (this._model.userClicks != this.userClicks) {
      this._model.userClicks = userClicks;
      this.emit('userClicksChange', userClicks);
    }
  }

  public get leaderboard(){
    return this._model.leaderboard;
  }

  public set leaderboard(userClicks: ScoreObject[]) {
    if (this._model.leaderboard != this.leaderboard) {
      this._model.leaderboard = this.leaderboard;
      this.emit('leaderboardChange', this.leaderboard);
    }
  }

  /**
   * @returns ViewingAreaModel that represents the current state of this ViewingAreaController
   */
  public danceAreaModel(): DanceAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this viewing area controller's model, setting the fields
   * isPlaying, elapsedTimeSec and video from the updatedModel
   *
   * @param updatedModel
   */
  public updateFrom(updatedModel: DanceAreaModel): void {
    this.difficulty = updatedModel.difficulty;
    this.timer = updatedModel.timer;
    this.currentScore = updatedModel.currentScore;
  }
}
