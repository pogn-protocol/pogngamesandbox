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
  let shouldAdvanceRound = false; //
  if (serverState.turnBased) {
    const playerIds = Object.keys(serverState.playerData).map(Number);
    const currentIndex = playerIds.indexOf(playerId);
    const isLastPlayer = currentIndex === playerIds.length - 1;
    const nextPlayer = playerIds[(currentIndex + 1) % playerIds.length];
    serverState.currentTurn = nextPlayer;

    shouldAdvanceRound = isLastPlayer;
  } else {
    shouldAdvanceRound = true;
  }

  if (shouldAdvanceRound) {
    serverState.roundNumber += 1;

    if (
      serverState.maxRounds &&
      serverState.roundNumber > serverState.maxRounds
    ) {
      const gameOverBroadcast = {};
      for (const id in serverState.playerData) {
        gameOverBroadcast[id] = {
          type: "game",
          action: "gameOver",
          payload: {
            message: "Max rounds reached. Game over.",
            roundNumber: serverState.roundNumber - 1,
          },
        };
      }
      return gameOverBroadcast;
    }
    // if (isLastPlayer) {
    //   serverState.roundNumber += 1; // Increment round number
    //   if (isLastPlayer || !serverState.turnBased) {
    //     serverState.roundNumber += 1;

    //     if (
    //       serverState.maxRounds &&
    //       serverState.roundNumber > serverState.maxRounds
    //     ) {
    //       const gameOverBroadcast = {};
    //       for (const id in serverState.playerData) {
    //         gameOverBroadcast[id] = {
    //           type: "game",
    //           action: "gameOver",
    //           payload: {
    //             message: "Max rounds reached. Game over.",
    //             roundNumber: serverState.roundNumber - 1,
    //           },
    //         };
    //       }
    //       return gameOverBroadcast;
    //     }
    //   }

    // }
  }

  return broadcastToAllPlayers(playerId);
}
