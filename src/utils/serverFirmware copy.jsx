export const serverState = {
  playerData: {},
  currentTurn: null,
  round: 1,
  rounds: null,
  gameInstance: null,
};

export function initServer({
  players = [],
  turnBased = true,
  rounds = null,
  GameClass = null,
}) {
  serverState.turnBased = turnBased;
  serverState.playerData = {};
  serverState.currentTurn = turnBased ? players[0] : null;
  serverState.round = 1;
  serverState.rounds = rounds;

  players.forEach((id) => {
    serverState.playerData[id] = { messages: [] };
  });

  let result = null;

  if (typeof GameClass === "function") {
    const instance = new GameClass();
    instance.players = new Map(players.map((p) => [p, {}]));
    serverState.gameInstance = instance;

    if (typeof instance.assignRoles === "function") {
      instance.assignRoles();
    }

    if (typeof instance.init === "function") {
      result = instance.init();
    }
  }

  const broadcast = {};
  for (const id of players) {
    broadcast[id] = {
      payload: {
        type: "game",
        action: "gameAction",
        playerId: id,
        youAre: id,
        currentTurn: serverState.currentTurn,
        round: serverState.round,
        rounds: serverState.rounds,
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

  const game = serverState.gameInstance;

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

  const gameHandlesTurn = typeof game.getTurnState === "function";

  if (
    !gameHandlesTurn &&
    serverState.turnBased &&
    playerId !== serverState.currentTurn
  ) {
    return {
      [playerId]: {
        payload: {
          type: "game",
          action: "notYourTurn",
          message: "It's not your turn.",
          currentTurn: serverState.currentTurn,
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

  if (!gameHandlesTurn && serverState.turnBased) {
    const ids = Object.keys(serverState.playerData);
    const currentIdx = ids.indexOf(playerId);
    const next = ids[(currentIdx + 1) % ids.length];
    serverState.currentTurn = next;

    if (currentIdx === ids.length - 1) {
      serverState.round++;
      if (serverState.rounds && serverState.round > serverState.rounds) {
        const out = {};
        for (const id of ids) {
          out[id] = {
            payload: {
              type: "game",
              action: "gameOver",
              message: "Max rounds reached.",
              round: serverState.round - 1,
              playerId: id,
            },
          };
        }
        return out;
      }
    }
  }

  const out = {};
  for (const id in serverState.playerData) {
    const isSender = String(id) === String(playerId);
    const { private: privateData, ...publicResult } = result || {};

    out[id] = {
      payload: {
        type: "game",
        action: "gameAction",
        playerId: id,
        youAre: id,
        round: serverState.round,
        rounds: serverState.rounds,
        ...(gameHandlesTurn
          ? game.getTurnState?.()
          : { currentTurn: serverState.currentTurn }),
        ...publicResult,
        ...(isSender && privateData ? { private: privateData } : {}),
      },
    };
  }

  return out;
}
