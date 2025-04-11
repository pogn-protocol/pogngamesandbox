// serverFirmware.js

export const serverState = {
  total: 0,
  playerData: {},
  currentTurn: null, // <-- NEW
};

export function initServer(players = [], turnBased = true) {
  serverState.turnBased = turnBased;
  serverState.total = 0;
  serverState.playerData = {};
  serverState.currentTurn = turnBased ? Number(players[0]) : null;

  players.forEach((id) => {
    serverState.playerData[id] = { sum: 0, messages: [] };
  });

  return broadcastToAllPlayers(null);
}

// export function initServer(players = []) {
//   // 💥 Reset
//   serverState.total = 0;
//   serverState.playerData = {};
//   serverState.currentTurn = players[0] || null;

//   players.forEach((id) => {
//     serverState.playerData[id] = { sum: 0, messages: [] };
//   });

//   return broadcastToAllPlayers(null); // ⬅️ Initial state
// }

export function updatePlayerData(playerId, msg, count = 0) {
  if (!serverState.playerData[playerId]) {
    serverState.playerData[playerId] = { sum: 0, messages: [] };
  }

  serverState.total += count;
  serverState.playerData[playerId].sum += count;
  serverState.playerData[playerId].messages.push(msg);
}

export function broadcastToAllPlayers(triggeredBy) {
  const broadcast = {};
  for (const id in serverState.playerData) {
    broadcast[id] = {
      type: "game",
      action: "update",
      payload: {
        total: serverState.total,
        playerData: serverState.playerData,
        lastUpdatedBy: triggeredBy,
        youAre: Number(id),
        //currentTurn: Number(serverState.currentTurn),
        currentTurn: serverState.turnBased
          ? Number(serverState.currentTurn)
          : null,
      },
    };
  }
  return broadcast;
}
