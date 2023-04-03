import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import {
  Interactable,
  TownEmitter,
  DanceArea,
  Difficulty,
  ArrowDirection,
  Display,
} from '../types/CoveyTownSocket';
import TownsStore from '../lib/TownsStore';
import { getLastEmittedEvent, mockPlayer, MockedPlayer, isDanceArea } from '../TestUtils';
import { TownsController } from './TownsController';

type TestTownData = {
  friendlyName: string;
  townID: string;
  isPubliclyListed: boolean;
  townUpdatePassword: string;
};

const broadcastEmitter = jest.fn();
describe('TownsController integration tests', () => {
  let controller: TownsController;

  const createdTownEmitters: Map<string, DeepMockProxy<TownEmitter>> = new Map();
  async function createTownForTesting(
    friendlyNameToUse?: string,
    isPublic = false,
  ): Promise<TestTownData> {
    const friendlyName =
      friendlyNameToUse !== undefined
        ? friendlyNameToUse
        : `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
    const ret = await controller.createTown({
      friendlyName,
      isPubliclyListed: isPublic,
      mapFile: 'testData/indoors.json',
    });
    return {
      friendlyName,
      isPubliclyListed: isPublic,
      townID: ret.townID,
      townUpdatePassword: ret.townUpdatePassword,
    };
  }
  function getBroadcastEmitterForTownID(townID: string) {
    const ret = createdTownEmitters.get(townID);
    if (!ret) {
      throw new Error(`Could not find broadcast emitter for ${townID}`);
    }
    return ret;
  }

  beforeAll(() => {
    // Set the twilio tokens to dummy values so that the unit tests can run
    process.env.TWILIO_API_AUTH_TOKEN = 'testing';
    process.env.TWILIO_ACCOUNT_SID = 'ACtesting';
    process.env.TWILIO_API_KEY_SID = 'testing';
    process.env.TWILIO_API_KEY_SECRET = 'testing';
  });

  beforeEach(async () => {
    createdTownEmitters.clear();
    broadcastEmitter.mockImplementation((townID: string) => {
      const mockRoomEmitter = mockDeep<TownEmitter>();
      createdTownEmitters.set(townID, mockRoomEmitter);
      return mockRoomEmitter;
    });
    TownsStore.initializeTownsStore(broadcastEmitter);
    controller = new TownsController();
  });

  describe('Interactables', () => {
    let testingTown: TestTownData;
    let player: MockedPlayer;
    let sessionToken: string;
    let interactables: Interactable[];

    beforeEach(async () => {
      testingTown = await createTownForTesting(undefined, true);
      player = mockPlayer(testingTown.townID);
      await controller.joinTown(player.socket);
      const initialData = getLastEmittedEvent(player.socket, 'initialize');
      sessionToken = initialData.sessionToken;
      // need to adjust initeData for test at 94
      interactables = initialData.interactables;
    });

    describe('Create Dance Area', () => {
      it('Executes without error when creating a new dance area', async () => {
        const danceArea = interactables.find(isDanceArea) as DanceArea;
        if (!danceArea) {
          fail('Expected at least one dance session area to be returned in the initial join data');
        } else {
          const newDanceArea = {
            id: danceArea.id,
            difficulty: 15 as Difficulty,
            correct: [],
            userClicks: [],
            leaderboard: [],
            currentScore: null,
            timer: 0,
          };
          await controller.createDanceArea(testingTown.townID, sessionToken, newDanceArea);
          // Check to see that the dance area was successfully updated
          const townEmitter = getBroadcastEmitterForTownID(testingTown.townID);
          const updateMessage = getLastEmittedEvent(townEmitter, 'interactableUpdate');
          if (isDanceArea(updateMessage)) {
            expect(updateMessage).toEqual(newDanceArea);
          } else {
            fail('Expected an interactableUpdate to be dispatched with the new dance area');
          }
        }
      });
      it('Returns an error message if the town ID is invalid', async () => {
        const danceArea = interactables.find(isDanceArea) as DanceArea;
        const newDanceArea = {
          id: danceArea.id,
          difficulty: 15 as Difficulty,
          correct: [],
          userClicks: [],
          leaderboard: [],
          currentScore: null,
          timer: 0,
        };
        await expect(
          controller.createDanceArea(nanoid(), sessionToken, newDanceArea),
        ).rejects.toThrow();
      });
      it('Checks for a valid session token before creating a dance area', async () => {
        const invalidSessionToken = nanoid();
        const danceArea = interactables.find(isDanceArea) as DanceArea;
        const newDanceArea = {
          id: danceArea.id,
          difficulty: 15 as Difficulty,
          correct: [],
          userClicks: [],
          leaderboard: [],
          currentScore: null,
          timer: 0,
        };
        await expect(
          controller.createDanceArea(testingTown.townID, invalidSessionToken, newDanceArea),
        ).rejects.toThrow();
      });
      it('Returns an error message if addDanceArea returns false', async () => {
        const danceArea = interactables.find(isDanceArea) as DanceArea;
        const newDanceArea = {
          id: nanoid(),
          difficulty: danceArea.difficulty,
          correct: danceArea.correct,
          userClicks: danceArea.userClicks,
          leaderboard: danceArea.leaderboard,
          currentScore: danceArea.currentScore,
          timer: 0,
        };

        await expect(
          controller.createDanceArea(testingTown.townID, sessionToken, newDanceArea),
        ).rejects.toThrow();
      });
    });
  });
});
