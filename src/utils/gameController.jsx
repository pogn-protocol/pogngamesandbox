import BaseGame from "./baseGame.js";
import TurnBasedGame from "./turnBasedGame.js";

export const gameState = {
  playerData: {},
  gameInstance: null,
};

export function initGame({ players = [], GameClass = null, options = {} }) {
  gameState.playerData = {};

  players.forEach((id) => {
    gameState.playerData[id] = { messages: [] };
  });

  let result = null;

  if (typeof GameClass === "function") {
    const instance = new GameClass(options);

    // Inject base class helpers
    const tempBase = new BaseGame(options.baseGameOptions || {});
    const baseHelpers = [
      "assignRoles",
      "assignRolesShuffled",
      "getGameDetails",
      "nextRound",
    ];
    for (const key of baseHelpers) {
      if (typeof tempBase[key] === "function") {
        instance[key] = tempBase[key].bind(instance);
      }
    }

    // Inject turn-based helpers, which override base if present
    const tempTurn = new TurnBasedGame({
      baseGameOptions: options.baseGameOptions || {},
      roleList: options.roleList || [],
    });
    const turnHelpers = ["switchTurn", "getTurnState"];
    for (const key of turnHelpers) {
      if (typeof tempTurn[key] === "function") {
        instance[key] = tempTurn[key].bind(instance);
      }
    }

    //instance.players = new Map(players.map((p) => [p, {}]));
    instance.players = new Map(players.map((p) => [p, { ready: false }]));
    instance.roles = {}; // Ensure roles object exists

    // Inject assignRolesShuffled if not present
    if (
      options?.roleList &&
      typeof instance.assignRolesShuffled !== "function"
    ) {
      instance.assignRolesShuffled =
        tempBase.assignRolesShuffled.bind(instance);
    }

    // Assign roles if roleList is provided
    if (
      typeof instance.assignRolesShuffled === "function" &&
      options?.roleList
    ) {
      //instance.assignRolesShuffled(options.roleList);
    }

    gameState.gameInstance = instance;

    // if (typeof instance.init === "function") {
    //   result = instance.init();
    // }
  }

  const broadcast = {};
  for (const id of players) {
    broadcast[id] = {
      payload: {
        type: "game",
        action: "gameAction",
        playerId: id,
        youAre: id,
        role: gameState.gameInstance?.roles?.[id],
        ...(result || {}),
      },
    };
  }

  return broadcast;
}

export function processGameMessage(msg) {
  console.log("[processGameMessage] msg:", msg);
  const { payload } = msg || {};
  const { playerId } = payload || {};
  if (!playerId) {
    throw new Error("Player ID is required.");
  }

  const game = gameState.gameInstance;

  if (payload.gameAction === "playerReady") {
    console.log("[processGameMessage] Player ready:", playerId);
    const player = game.players.get(playerId);
    if (!player) {
      console.log("[processGameMessage] Player not found:", playerId);
      return {
        [playerId]: {
          payload: {
            type: "error",
            message: "Player not found in game.",
          },
        },
      };
    }

    if (game.getGameDetails()?.gameStatus === "in-progress") {
      return {}; // do nothing
    }

    player.ready = true;

    const allReady = Array.from(game.players.values()).every(
      (p) => p.ready === true
    );
    console.log("[processGameMessage] All players ready?", allReady);

    if (allReady && typeof game.init === "function") {
      console.log(
        "[processGameMessage] All players are ready, initializing game."
      );
      const result = game.init();
      console.log("[processGameMessage] Game initialized:", result);
      const out = {};
      for (const id of game.players.keys()) {
        out[id] = {
          payload: {
            type: "game",
            action: "gameAction",
            playerId: id,
            youAre: id,
            //role: game.roles?.[id],
            // ...(typeof game.getTurnState === "function"
            //   ? game.getTurnState()
            //   : {}),
            ...(result || {}),
          },
        };
      }
      return out;
    }

    return {
      [playerId]: {
        payload: {
          type: "game",
          action: "gameAction",
          gameAction: "playerReady",
          message: "You are now ready.",
          readyStates: Object.fromEntries(
            Array.from(game.players.entries()).map(([id, val]) => [
              id,
              val.ready,
            ])
          ),
        },
      },
    };
  }

  if (!game || typeof game.processAction !== "function") {
    return {
      [playerId]: {
        payload: {
          type: "error",
          action: "gameError",
          message: "Game not initialized.",
          playerId,
        },
      },
    };
  }

  let result;
  try {
    result = game.processAction(playerId, payload);
  } catch (err) {
    return {
      [playerId]: {
        payload: {
          type: "error",
          action: "gameError",
          message: err.message,
          playerId,
        },
      },
    };
  }

  const out = {};
  for (const id in gameState.playerData) {
    const isSender = String(id) === String(playerId);
    const { private: privateData, ...publicResult } = result || {};

    out[id] = {
      payload: {
        type: "game",
        action: "gameAction",
        playerId: id,
        youAre: id,
        role: gameState.gameInstance?.roles?.[id],
        ...(typeof game.getTurnState === "function" ? game.getTurnState() : {}),
        ...publicResult,
        ...(isSender && privateData ? { private: privateData } : {}),
      },
    };
  }

  return out;
}
