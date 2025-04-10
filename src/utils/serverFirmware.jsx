// serverFirmware.js

export const serverState = {
  total: 0,
  playerData: {},
};

export function initServer(players = []) {
  players.forEach((id) => {
    if (!serverState.playerData[id]) {
      serverState.playerData[id] = { sum: 0, messages: [] };
    }
  });
}

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
      },
    };
  }
  return broadcast;
}
