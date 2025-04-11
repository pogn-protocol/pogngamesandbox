// function handleServerMessage(msg) {
//   const { playerId, count = 0 } = msg?.payload || {};

//   updatePlayerData(playerId, msg, count);

//   return broadcastToAllPlayers(playerId);
// }

function handleServerMessage(msg) {
  console.log("handleServerMessage:", msg);
  console.log("serverState:", serverState);
  const { playerId, count = 0 } = msg?.payload || {};

  if (serverState.turnBased && playerId !== serverState.currentTurn) {
    return {
      [playerId]: {
        type: "game",
        action: "notYourTurn",
        payload: {
          message: `It's not your turn.`,
          currentTurn: serverState.currentTurn,
        },
      },
    };
  }

  updatePlayerData(playerId, msg, count);

  // Advance turn to the next player
  // const playerIds = Object.keys(serverState.playerData).map(Number); // ensure all numeric
  // const currentIndex = playerIds.indexOf(playerId); // both are numbers now
  // const nextPlayer = playerIds[(currentIndex + 1) % playerIds.length];
  // serverState.currentTurn = nextPlayer;
  if (serverState.turnBased) {
    const playerIds = Object.keys(serverState.playerData).map(Number);
    const currentIndex = playerIds.indexOf(playerId);
    const nextPlayer = playerIds[(currentIndex + 1) % playerIds.length];
    serverState.currentTurn = nextPlayer;
  }

  return broadcastToAllPlayers(playerId);
}
