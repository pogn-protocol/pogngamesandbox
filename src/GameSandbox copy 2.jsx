// REFACTORED GameSandbox with per-player state, clean transpile hook, and JSON viewer extraction

import React, { useState, useRef } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

// JSON viewer wrapper
const CollapsedJson = ({ data }) => (
  <JsonView
    data={data}
    shouldExpandNode={(level, value, field) =>
      level === 0 || field === "payload"
    }
  />
);

const loadExternalScripts = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = (e) =>
        reject(new Error(`❌ Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  });
  await Promise.all(promises);
};

// Hook to handle transpiling the client component
const useTranspiledComponent = () => {
  const transpile = async (code, args, values) => {
    const transpiled = Babel.transform(code, {
      presets: ["react"],
    }).code;
    const factory = new Function(
      ...args,
      `${transpiled}; return GameComponent;`
    );
    return factory(...values);
  };
  return { transpile };
};

const GameSandbox = () => {
  const componentRef = useRef(null);
  const { transpile } = useTranspiledComponent();

  const [clientCode, setClientCode] = useState(`
    function GameComponent({ JsonView, sendGameMessage, gameState, playerId, gameId }) {
      const [count, setCount] = React.useState(0);
      const [gameStates, setGameStates] = React.useState([]);
      React.useEffect(() => {
        if (gameState) {
          setGameStates((prev) => [...prev, gameState]);
        }
      }, [gameState]);
      return (
        <div className="p-4 bg-gray-100 rounded shadow space-y-4">
          <div className="bg-blue-200 text-black text-center p-2 font-bold rounded">
            🎮 Game Client Ready Player: ({playerId})
          </div>
          <p className="text-black text-lg">Count: {count}</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              +1
            </button>
            <button onClick={() => sendGameMessage({
              payload: {
                type: "game",
                action: "gameAction",
                gameAction: "submitCount",
                count,
                playerId,
                gameId,
              },
            })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Send to Server
            </button>
          </div>
          {gameStates.length > 0 && (
            <>
              {gameStates.map((state, index) => (
                <div key={index} className="border rounded p-2 bg-gray-200 mb-2 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold mb-1">Game State {index + 1}</h4>
                  <JsonView data={state} shouldExpandNode={(l, v, f) => l === 0 || f === "payload"} />
                </div>
              ))}
              <div className="border rounded p-2 bg-gray-200 mt-4 text-[12px] leading-[1.2] text-left">
                <h4 className="font-semibold mb-1">All Game States</h4>
                <JsonView data={gameStates} shouldExpandNode={(l, v, f) => l === 0 || f === "payload"} />
              </div>
            </>
          )}
        </div>
      );
    }
  `);

  const [serverCode, setServerCode] = useState(`
function handleServerMessage(msg) {
  console.log("Server received:", msg);
  return { ...msg };
}`);

  const [PlayerGameComponent, setPlayerGameComponent] = useState(null);
  const [playerStates, setPlayerStates] = useState({});
  const [numPlayers, setNumPlayers] = useState(2);
  const [userImports, setUserImports] = useState([]);

  const handleRun = async () => {
    await loadExternalScripts(userImports.filter(Boolean));
    try {
      const serverFn = new Function(
        `${serverCode}; return handleServerMessage;`
      )();

      const EvaluatedComponent = await transpile(
        clientCode,
        ["React", "sendGameMessage", "gameState", "playerId", "gameId"],
        [React, () => {}, {}, 0, ""]
      );

      componentRef.current = EvaluatedComponent;
      setPlayerGameComponent(() => componentRef.current);

      const sendToServer = (msg, playerId) => {
        try {
          const res = serverFn(msg);
          setPlayerStates((prev) => ({
            ...prev,
            [playerId]: {
              lastInput: msg,
              lastResponse: res,
            },
          }));
        } catch (err) {
          const error = { error: err.message };
          setPlayerStates((prev) => ({
            ...prev,
            [playerId]: {
              lastInput: msg,
              lastResponse: error,
            },
          }));
        }
      };

      window.sendToServer = sendToServer; // expose for PlayerGameComponent
    } catch (err) {
      console.error("Transpile error:", err);
      alert("Failed to run code. Check console.");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">POGN Game Sandbox</h1>

      <textarea
        value={userImports.join("\n")}
        onChange={(e) => setUserImports(e.target.value.split("\n"))}
        className="w-full h-24 p-2 font-mono bg-gray-800 text-yellow-300 rounded"
        placeholder="External script URLs"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          value={clientCode}
          onChange={(e) => setClientCode(e.target.value)}
          className="w-full h-64 p-2 font-mono bg-gray-900 text-green-300 rounded"
        />
        <textarea
          value={serverCode}
          onChange={(e) => setServerCode(e.target.value)}
          className="w-full h-64 p-2 font-mono bg-gray-900 text-blue-300 rounded"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="font-semibold">Players:</label>
        <input
          type="number"
          min={1}
          max={10}
          value={numPlayers}
          onChange={(e) => setNumPlayers(Number(e.target.value))}
          className="w-16 px-2 py-1 border rounded"
        />
      </div>

      <button
        onClick={handleRun}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Run Game
      </button>

      {PlayerGameComponent && (
        <div className="flex flex-wrap gap-4 border border-gray-300 rounded p-4 bg-white">
          {Array.from({ length: numPlayers }, (_, i) => {
            const playerId = i + 1;
            const playerState = playerStates[playerId] || {};
            return (
              <div
                key={playerId}
                className="w-full md:w-[45%] lg:w-[30%] p-2 border rounded shadow"
              >
                <h4 className="text-center font-bold mb-2">
                  Player {playerId}
                </h4>
                <PlayerGameComponent
                  sendGameMessage={(msg) =>
                    window.sendToServer({ ...msg, playerId }, playerId)
                  }
                  gameState={playerState.lastResponse}
                  playerId={playerId}
                  gameId={`game-${playerId}`}
                  JsonView={JsonView}
                />
              </div>
            );
          })}
        </div>
      )}

      {Object.keys(playerStates).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {Object.entries(playerStates).map(
            ([pid, { lastInput, lastResponse }]) => (
              <div key={pid}>
                <h3 className="font-semibold">Player {pid}</h3>
                <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold">Sent to Server</h4>
                  <CollapsedJson data={lastInput} />
                </div>
                <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold">Received from Server</h4>
                  <CollapsedJson data={lastResponse} />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GameSandbox;
