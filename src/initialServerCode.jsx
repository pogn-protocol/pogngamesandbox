function handleServerMessage(msg) {
  const { playerId, count = 0 } = msg?.payload || {};

  updatePlayerData(playerId, msg, count);

  return broadcastToAllPlayers(playerId);
}
