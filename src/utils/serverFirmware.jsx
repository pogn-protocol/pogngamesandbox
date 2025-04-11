// serverFirmware.js

export const serverState = {
  playerData: {},
  currentTurn: null,
  roundNumber: 1,
  maxRounds: null,
  gameInstance: null, // 👈 user game logic class instance
};

// export function initServer(
//   players = [],
//   turnBased = true,
//   maxRounds = null,
//   GameClass = null
// ) {
//   serverState.turnBased = turnBased;
//   serverState.playerData = {};
//   serverState.currentTurn = turnBased ? Number(players[0]) : null;
//   serverState.roundNumber = 1;
//   serverState.maxRounds = maxRounds;

//   players.forEach((id) => {
//     serverState.playerData[id] = { messages: [] };
//   });

//   if (typeof GameClass === "function") {
//     const instance = new GameClass();
//     instance.players = new Map(players.map((p) => [p, {}]));
//     if (typeof instance.assignRoles === "function") {
//       instance.assignRoles();
//     }
//     serverState.gameInstance = instance;
//   }

//   const broadcast = broadcastToAllPlayers(null);

//   // ✅ Spread the result (if any) into everyone's broadcast
//   if (result && typeof result === "object") {
//     for (const id in broadcast) {
//       broadcast[id] = {
//         ...broadcast[id],
//         payload: {
//           ...broadcast[id].payload,
//           ...result,
//         },
//       };
//     }
//   }

//   return broadcast;}

export function initServer(
  players = [],
  turnBased = true,
  maxRounds = null,
  GameClass = null
) {
  serverState.turnBased = turnBased;
  serverState.playerData = {};
  serverState.currentTurn = turnBased ? Number(players[0]) : null;
  serverState.roundNumber = 1;
  serverState.maxRounds = maxRounds;

  players.forEach((id) => {
    serverState.playerData[id] = { messages: [] };
  });

  let result = null;

  if (typeof GameClass === "function") {
    const instance = new GameClass();
    instance.players = new Map(players.map((p) => [p, {}]));

    if (typeof instance.assignRoles === "function") {
      instance.assignRoles();
    }

    serverState.gameInstance = instance;

    // 🔥 NEW: Let the game init itself and return initial data
    if (typeof instance.init === "function") {
      result = instance.init(); // optional game-level init
    } else if (typeof instance.processAction === "function") {
      // fallback: let it fake an initial request to return state
      //result = instance.processAction(players[0], { gameAction: "init" });
    }
  }

  const broadcast = broadcastToAllPlayers(null);
  console.log("initServer broadcast", broadcast);
  // ✅ Spread the result (if any) into everyone's broadcast
  for (const id in broadcast) {
    broadcast[id] = {
      ...broadcast[id],
      payload: {
        ...broadcast[id],
        ...result, // if result is null/undefined, it's ignored
      },
    };
  }
  console.log("initServer broadcast retun", broadcast);
  return broadcast;
}

export function processGameMessage(msg) {
  console.log("processGameMessage", msg);
  const { payload } = msg || {};
  const { playerId } = payload || {};
  const game = serverState.gameInstance;

  if (serverState.turnBased && playerId !== serverState.currentTurn) {
    return {
      [playerId]: {
        payload: {
          type: "game",
          action: "notYourTurn",
          message: `It's not your turn.`,
          currentTurn: serverState.currentTurn,
        },
      },
    };
  }

  let result;
  try {
    result = game.processAction(playerId, payload); // 👈 custom game logic
    console.log("FIRMWARE: processGameMessage result", result);
  } catch (err) {
    return {
      [playerId]: {
        payload: { type: "error", action: "gameError", message: err.message },
      },
    };
  }

  // Advance round if needed
  let shouldAdvanceRound = false;
  if (serverState.turnBased) {
    const ids = Object.keys(serverState.playerData).map(Number);
    const i = ids.indexOf(playerId);
    const isLast = i === ids.length - 1;
    const next = ids[(i + 1) % ids.length];
    serverState.currentTurn = next;
    shouldAdvanceRound = isLast;
  } else {
    shouldAdvanceRound = true;
  }

  if (shouldAdvanceRound) {
    serverState.roundNumber++;
    if (
      serverState.maxRounds &&
      serverState.roundNumber > serverState.maxRounds
    ) {
      const gameOver = {};
      for (const id in serverState.playerData) {
        gameOver[id] = {
          payload: {
            type: "game",
            action: "gameOver",
            message: "Max rounds reached. Game over.",
            roundNumber: serverState.roundNumber - 1,
          },
        };
      }
      return gameOver;
    }
  }

  const baseBroadcast = broadcastToAllPlayers(playerId);

  for (const id in baseBroadcast) {
    baseBroadcast[id] = {
      ...baseBroadcast[id],
      payload: {
        ...baseBroadcast[id],
        ...result,
      },
    };
  }

  console.log("processGameMessage merged result", baseBroadcast);
  return baseBroadcast;
}

export function broadcastToAllPlayers(triggeredBy) {
  const broadcast = {};
  for (const id in serverState.playerData) {
    broadcast[id] = {
      type: "game",
      action: "gameAction",
      playerData: serverState.playerData,
      lastUpdatedBy: triggeredBy,
      youAre: Number(id),
      currentTurn: serverState.turnBased
        ? Number(serverState.currentTurn)
        : null,
      roundNumber: serverState.roundNumber,
      maxRounds: serverState.maxRounds,
    };
  }
  return broadcast;
}
