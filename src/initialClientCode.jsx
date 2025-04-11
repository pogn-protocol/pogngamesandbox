function GameComponent({
  JsonView,
  sendGameMessage,
  gameState,
  playerId,
  gameId,
}) {
  const [count, setCount] = React.useState(0);
  const [gameStates, setGameStates] = React.useState([]);

  // 🔥 NEW: determine if it's this player's turn
  const isMyTurn =
    gameState?.payload?.currentTurn == null || // 🆓 Not turn-based
    Number(gameState.payload.currentTurn) === Number(playerId); // ✅ If turn-based, it's my turn
  const currentTurn = gameState?.payload?.currentTurn;

  React.useEffect(() => {
    if (gameState) {
      setGameStates((prev) => [...prev, gameState]);
    }
  }, [gameState]);

  if (gameState?.action === "gameOver") {
    return (
      <div className="p-4 bg-red-100 rounded shadow space-y-4 text-center">
        <h2 className="text-xl font-bold text-red-700">🛑 Game Over</h2>
        <p>{gameState.payload?.message}</p>
        <p>Rounds Played: {gameState.payload?.roundNumber}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded shadow space-y-4">
      <div className="bg-blue-200 text-black text-center p-2 font-bold rounded">
        🎮 Game Client Ready Player: ({playerId})
      </div>
      <div className="text-center text-sm font-semibold mt-2">
        {/* {isMyTurn ? (
          <p className="text-green-600">✅ Your Turn!</p>
        ) : (
          <p className="text-gray-500">⏳ Waiting for Player {currentTurn}</p>
        )} */}
        {gameState?.payload?.roundNumber != null && (
          <p className="text-sm text-purple-700 font-bold">
            🌀 Round: {gameState.payload.roundNumber}
          </p>
        )}

        {gameState?.payload?.currentTurn != null && (
          <div className="text-center text-sm font-semibold mt-2">
            {isMyTurn ? (
              <p className="text-green-600">✅ Your Turn!</p>
            ) : (
              <p className="text-gray-500">
                ⏳ Waiting for Player {currentTurn}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-black text-lg">Count: {count}</p>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          +1
        </button>
        <button
          onClick={() =>
            sendGameMessage({
              payload: {
                type: "game",
                action: "gameAction",
                gameAction: "submitCount",
                count,
                playerId,
                gameId,
              },
            })
          }
          disabled={!isMyTurn} // 🔥 NEW
          className={`px-4 py-2 rounded transition ${
            isMyTurn
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Send to Server
        </button>

        {/* <button
          onClick={() =>
            sendGameMessage({
              payload: {
                type: "game",
                action: "gameAction",
                gameAction: "submitCount",
                count,
                playerId,
                gameId,
              },
            })
          }
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Send to Server
        </button> */}
      </div>

      {gameStates.length > 0 && (
        <>
          {gameStates.map((state, index) => (
            <div
              key={index}
              className="border rounded p-2 bg-gray-200 mb-2 text-[12px] leading-[1.2] text-left"
            >
              <h4 className="font-semibold mb-1">Game State {index + 1}</h4>
              <JsonView
                data={state}
                shouldExpandNode={(l, v, f) => l === 0 || f === "payload"}
              />
            </div>
          ))}

          <div className="border rounded p-2 bg-gray-200 mt-4 text-[12px] leading-[1.2] text-left">
            <h4 className="font-semibold mb-1">All Game States</h4>
            <JsonView
              data={gameStates}
              shouldExpandNode={(l, v, f) => l === 0 || f === "payload"}
            />
          </div>
        </>
      )}
    </div>
  );
}
