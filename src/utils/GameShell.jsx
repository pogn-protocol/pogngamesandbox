import React from "react";

export default function GameShell({ playerId, gameState, children }) {
  console.log("GameShell:", playerId, gameState, children);
  const round = gameState?.round;
  const currentTurn = gameState?.currentTurn;
  const isMyTurn =
    currentTurn == null || Number(currentTurn) === Number(playerId);

  if (gameState?.action === "gameOver") {
    return (
      <div className="p-4 bg-red-100 rounded shadow space-y-4 text-center">
        <h2 className="text-xl font-bold text-red-700">🛑 Game Over</h2>
        <p>{gameState?.message}</p>
        <p>Rounds Played: {round}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded shadow space-y-4">
      <div className="bg-blue-200 text-black text-center p-2 font-bold rounded">
        🎮 Game Client Ready Player: ({playerId})
      </div>
      {round != null && (
        <p className="text-sm text-purple-700 font-bold text-center">
          🌀 Round: {round}
        </p>
      )}
      {gameState?.role && <p>🧩 Your Role: {gameState.role}</p>}
      {currentTurn != null && (
        <div className="text-center text-sm font-semibold mt-2">
          {isMyTurn ? (
            <p className="text-green-600">✅ Your Turn!</p>
          ) : (
            <p className="text-gray-500">⏳ Waiting for Player {currentTurn}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function wrapGameComponent(UserComponent) {
  return function Wrapped(props) {
    return (
      <GameShell playerId={props.playerId} gameState={props.gameState}>
        <UserComponent {...props} />
      </GameShell>
    );
  };
}
