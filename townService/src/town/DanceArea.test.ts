import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { Difficulty, TownEmitter, Arrow, ScoreObject } from '../types/CoveyTownSocket';
import { getLastEmittedEvent } from '../TestUtils';
import DanceArea from './DanceArea';

describe('DanceArea', () => {
  // put some tests here
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: DanceArea;
  const townEmitter = mock<TownEmitter>();
  const difficulty: Difficulty = 15;
  const correct: Arrow[] = [];
  const areaId = nanoid();
  let newPlayer: Player;
  const playerID = nanoid();
  const currentScore: ScoreObject = { userId: playerID, score: 0 };
  const timer = 300;

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new DanceArea(
      {
        id: areaId,
        difficulty,
        correct,
        userClicks: [],
        leaderboard: [],
        currentScore,
        timer: 300,
      },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(playerID, mock<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('add()', () => {
    // tests for the add() method
    it('Adds the player to the occupants list and emits an interactableUpdate event', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id: areaId,
        difficulty,
        correct,
        userClicks: [],
        leaderboard: [],
        currentScore,
        timer,
      });
    });

    it('Sets the location of the newly added player and emits a playerMoved event', () => {
      expect(newPlayer.location.interactableID).toEqual(areaId);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(areaId);
    });
  });

  describe('remove()', () => {
    // tests for the remove() method
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      // Add another player so that we are not also testing what happens when the last player leaves
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      testArea.add(extraPlayer);
      testArea.remove(newPlayer);

      expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id: areaId,
        difficulty,
        correct,
        userClicks: [],
        leaderboard: [],
        currentScore,
        timer,
      });
    });
    it("Clears the player's interactableID and emits an update for their location", () => {
      testArea.remove(newPlayer);
      expect(newPlayer.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });
  });

  describe('toModel()', () => {
    it('sets all properties of the danceArea correctly', () => {
      const model = testArea.toModel();
      expect(model).toEqual({
        id: areaId,
        difficulty,
        correct,
        userClicks: [],
        leaderboard: [],
        currentScore,
        timer,
      });
    });
  });

  describe('updateModel()', () => {
    // tests for updateModel() method
    it('Check that all properties are changed correctly', () => {
      const newId = "won't be used";
      const newDifficulty: Difficulty = 10;
      const newCorrect: Arrow[] = [{ display: '⇦', direction: 'L', duration: 1 }];
      const newUserClicks: Arrow[] = [{ display: '⇨', direction: 'R', duration: 0.5 }];
      const newCurrentScore = { userId: newId, score: 100 };
      const newLeaderboard = [newCurrentScore];
      const newTimer = 20 * 10;

      testArea.updateModel({
        id: newId,
        difficulty: newDifficulty,
        correct: newCorrect,
        userClicks: newUserClicks,
        leaderboard: newLeaderboard,
        currentScore: newCurrentScore,
        timer: newTimer,
      });

      expect(testArea.id).toBe(areaId);
      expect(testArea.difficulty).toBe(newDifficulty);
      expect(testArea.correct).toBe(newCorrect);
      expect(testArea.userClicks).toBe(newUserClicks);
      expect(testArea.leaderboard).toBe(newLeaderboard);
      expect(testArea.currentScore).toBe(newCurrentScore);
    });
  });

  describe('fromMapObject()', () => {
    // tests for fromMapObject method
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        DanceArea.fromMapObject({ id: 1, name: nanoid(), visible: true, x: 0, y: 0 }, townEmitter),
      ).toThrowError();
    });

    it('Construct a valid DanceArea from a map object', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = DanceArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.occupantsByID).toEqual([]);
      expect(val.difficulty).toEqual(15);
      expect(val.correct).toEqual([]);
      expect(val.userClicks).toEqual([]);
      expect(val.leaderboard).toEqual([]);
      expect(val.currentScore).toEqual({ userId: '', score: 0 });
    });
  });
});
