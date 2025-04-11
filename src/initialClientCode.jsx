function GameComponent({ sendGameMessage, gameState, playerId, gameId }) {
  const [count, setCount] = React.useState(0);
  console.log("GameComponent:", gameState, playerId, gameId, count);
  return (
    <div>
      <p>Count: {count}</p>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
        onClick={() => {
          const msg = {
            gameAction: "submitCount",
            count,
            playerId,
            gameId,
          };

          console.log("📤 Submitting message:", msg);
          sendGameMessage(msg);
        }}
      >
        Submit
      </button>
    </div>
  );
}
