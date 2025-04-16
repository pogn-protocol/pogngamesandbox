import BaseGame from "./baseGame.js";
import TurnBasedGame from "./turnBasedGame.js";

//notes for refactor
//sendGameMessage needs payload and action
// sendGameMessage({payload: {
// action: "gameAction",

//   gameAction: "chooseNumber",
//   playerId,
//   gameId,  <<< doesn't need gameid
//   number,
// }});
// need to always return gameId
export const gameState = {
  playerData: {},
  gameInstance: null,
};

// export function initGame({ players = [], GameClass = null, options = {} }) {
//   gameState.playerData = {};

//   players.forEach((id) => {
//     gameState.playerData[id] = { messages: [] };
//   });

//   let result = null;

//   if (typeof GameClass === "function") {
//     const instance = new GameClass(options);

//     instance.players = new Map(players.map((p) => [p, { ready: false }]));
//     instance.roles = instance.roles || {};

//     gameState.gameInstance = instance;

//     if (typeof instance.init === "function") {
//       result = instance.init();
//     }
//   }

//   const broadcast = {};
//   for (const id of players) {
//     broadcast[id] = {
//       payload: {
//         type: "game",
//         action: "gameAction",
//         playerId: id,
//         youAre: id,
//         role: gameState.gameInstance?.roles?.[id],
//         ...(result || {}),
//       },
//     };
//   }

//   return broadcast;
// }

export function initGame({ players = [], GameClass = null, options = {} }) {
  console.log("[initGame] Initializing game with players:", players);
  console.log("[initGame] GameClass:", GameClass);
  console.log("[initGame] Options:", options);
  gameState.playerData = {};

  players.forEach((id) => {
    gameState.playerData[id] = { messages: [] };
  });

  if (typeof GameClass === "function") {
    const instance = new GameClass(options);
    instance.players = new Map(players.map((p) => [p, { ready: false }]));
    instance.roles = instance.roles || {};
    gameState.gameInstance = instance;
  }

  // Don’t broadcast here
  return {};
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
      console.warn(
        "[processGameMessage] Game already in progress, ignoring player ready."
      );
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
    console.log("[processGameMessage] Processing action:", payload);
    result = game.processAction(playerId, payload);
    console.log("[processGameMessage] Game action result:", result);
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
