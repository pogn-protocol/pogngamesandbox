function GameComponent({ sendGameMessage, gameState, playerId, gameId }) {
  const currentPlayer = playerId;
  const board = gameState?.board || Array(9).fill(null);
  const currentTurn = gameState?.currentTurn;
  const winner = gameState?.winner;
  const message = gameState?.message;

  const handleClick = (index) => {
    if (board[index] || winner || currentTurn !== currentPlayer) return;

    sendGameMessage({
      gameAction: "makeMove",
      playerId,
      gameId,
      index,
    });
  };

  return (
    <div className="space-y-4">
      <p className="font-bold text-lg text-blue-700">🎯 Player {playerId}</p>
      <p className="text-sm">Current Turn: Player {currentTurn}</p>
      {winner && (
        <p className="text-green-600 font-semibold">
          🏆 Winner: Player {winner}
        </p>
      )}
      {message && <p className="text-sm text-gray-500 italic">{message}</p>}

      <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-12 h-12 text-xl font-bold border border-gray-400 rounded bg-white"
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}
