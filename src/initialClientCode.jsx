const GameComponent = ({ sendGameMessage, gameState, playerId }) => {
  const [input, setInput] = React.useState("");

  const submit = () => {
    console.log("playerId", playerId, "input", input);
    const number = parseInt(input);
    if (!isNaN(number)) {
      sendGameMessage({
        gameAction: "submitNumber",
        number,
      });
    }
  };

  return (
    <div className="space-y-2">
      <p>You are Player {playerId}</p>
      <input
        type="number"
        placeholder="Enter a number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="p-1 border"
      />
      <button
        onClick={submit}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        Submit
      </button>

      <pre className="text-sm mt-2">{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
};

const defaultExport = GameComponent;
