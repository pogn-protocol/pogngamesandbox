import React, { useState, useRef } from "react";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const loadExternalScripts = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve(); // already loaded
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

const GameSandbox = () => {
  const componentRef = useRef(null);

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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Send to Server
            </button>
          </div>
  
          {gameStates && gameStates.length > 0 && (
            <>
              {gameStates.map((state, index) => (
                <div key={index} className="border rounded p-2 bg-gray-200 mb-2 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold mb-1">Game State {index + 1}</h4>
                  <JsonView
                    data={state}
                    shouldExpandNode={(level, value, field) =>
                      level === 0 || field === "payload"
                    }
                  />
                </div>
              ))}
  
              <div className="border rounded p-2 bg-gray-200 mt-4 text-[12px] leading-[1.2] text-left">
                <h4 className="font-semibold mb-1">All Game States</h4>
                <JsonView
                  data={gameStates}
                  shouldExpandNode={(level, value, field) =>
                    level === 0 || field === "payload"
                  }
                />
              </div>
            </>
          )}
        </div>
      );
    }
  `);

  const [serverCode, setServerCode] = useState(`
// A mock gameRelay and gameController that echoes the message
function handleServerMessage(msg) {
  console.log("Server received:", msg);
  return { ...msg };
}
`);

  const [PlayerGameComponent, setPlayerGameComponent] = useState(null);
  const [lastServerInput, setLastServerInput] = useState(null);
  const [lastServerMsg, setLastServerMsg] = useState(null);
  const [lastClientInput, setLastClientInput] = useState(null);
  const [lastClientMsg, setLastClientMsg] = useState(null);
  const [numPlayers, setNumPlayers] = useState(2); // Default to 2 players
  const [userImports, setUserImports] = useState([]);

  const handleRun = async () => {
    console.log("▶️ Running sandbox...");
    console.log("📦 Loading external scripts...");
    await loadExternalScripts(userImports.filter(Boolean));
    console.log("✅ Scripts loaded.");

    try {
      console.log("🧠 Compiling server code...");
      const compiledServerFn = new Function(
        `${serverCode}; return handleServerMessage;`
      )();
      console.log("✅ Server function compiled:", compiledServerFn);

      const sendToServer = (msg) => {
        console.log("📤 Client sent:", msg);
        try {
          setLastClientInput(msg);
          setLastServerInput(msg);
          const response = compiledServerFn(msg);
          console.log("📬 Server responded:", response);
          setLastServerMsg(response);
          setLastClientMsg(response);
        } catch (err) {
          console.error("❌ Server processing error:", err);
          const errorObj = { error: err.message };
          setLastServerMsg(errorObj);
          setLastClientMsg(errorObj);
        }
      };

      console.log("🔧 Transpiling client code...");

      const transpiled = Babel.transform(clientCode, {
        presets: ["react"],
      }).code;
      console.log("✅ Transpiled code:", transpiled);

      console.log("⚙️ Creating component...");
      const createComponent = new Function(
        "React",
        "sendGameMessage",
        "gameState",
        "playerId",
        "gameId",
        `${transpiled}; return GameComponent;`
      );

      const EvaluatedComponent = createComponent(
        React,
        sendToServer,
        lastServerMsg
      );
      console.log("✅ Component created:", EvaluatedComponent);
      componentRef.current = EvaluatedComponent;
      setPlayerGameComponent(() => componentRef.current);

      console.log("🎉 Sandbox execution complete!");
    } catch (err) {
      console.error("🔥 Top-level error in handleRun:", err);
      alert("Failed to run code. Check console.");
    }
  };
  console.log("🖼️ Rendering GameSandbox", { PlayerGameComponent });

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-4">POGN Game Sandbox</h1>
      </div>

      <div className="p-4 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-center text-xl font-bold rounded shadow-lg">
        ✅ Tailwind is working!
      </div>
      <div>
        <h2 className="font-bold mb-2">External Scripts (CDNs)</h2>
        <textarea
          value={userImports.join("\n")}
          onChange={(e) => setUserImports(e.target.value.split("\n"))}
          className="w-full h-24 p-2 font-mono bg-gray-800 text-yellow-300 rounded"
          spellCheck={false}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter each script URL on a new line.
        </p>
      </div>

      {/* Code Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold mb-2">Client Code Sandbox</h2>
          <textarea
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            className="w-full h-64 p-2 font-mono bg-gray-900 text-green-300 rounded"
            spellCheck={false}
          />
        </div>
        <div>
          <h2 className="font-bold mb-2">Server Code Sandbox</h2>
          <textarea
            value={serverCode}
            onChange={(e) => setServerCode(e.target.value)}
            className="w-full h-64 p-2 font-mono bg-gray-900 text-blue-300 rounded"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Run Button */}
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
          {Array.from({ length: numPlayers }, (_, i) => (
            <div
              key={i}
              className="w-full md:w-[45%] lg:w-[30%] p-2 border rounded shadow"
            >
              <h4 className="text-center font-bold mb-2">Player {i + 1}</h4>
              <PlayerGameComponent
                sendGameMessage={(msg) => {
                  const messageWithPlayerId = { ...msg, playerId: i + 1 };
                  console.log(`📤 Player ${i + 1} send:`, messageWithPlayerId);
                  try {
                    setLastClientInput(messageWithPlayerId);
                    setLastServerInput(messageWithPlayerId);
                    const response = new Function(
                      `${serverCode}; return handleServerMessage;`
                    )()(messageWithPlayerId);
                    setLastServerMsg(response);
                    setLastClientMsg(response);
                  } catch (err) {
                    console.error(`❌ Error for player ${i + 1}:`, err);
                    const error = { error: err.message };
                    setLastServerMsg(error);
                    setLastClientMsg(error);
                  }
                }}
                gameState={lastServerMsg}
                playerId={i + 1}
                gameId={`game-${i + 1}`}
                JsonView={JsonView}
              />
            </div>
          ))}
        </div>
      )}

      {(lastClientInput ||
        lastClientMsg ||
        lastServerInput ||
        lastServerMsg) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Client Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md mb-2">Client</h3>
            <div className="jsonMessage border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
              <h4 className="font-semibold mb-1">Sent to Server</h4>
              {console.log("🧪 lastClientInput:", lastClientInput)}
              <JsonView
                data={lastClientInput}
                shouldExpandNode={(level, value, field) => {
                  const expand = level === 0 || field === "payload";
                  return expand;
                }}
              />
            </div>
            <div className="jsonMessage border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
              <h4 className="font-semibold  mb-1">Received from Server</h4>
              <JsonView
                data={lastClientMsg}
                shouldExpandNode={(level, value, field) => {
                  const expand = level === 0 || field === "payload";
                  return expand;
                }}
              />
            </div>
          </div>

          {/* Server Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md mb-2">Server</h3>
            <div className="jsonMessage border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
              <h4 className="font-semibold  mb-1">Received from Client</h4>
              <JsonView
                data={lastServerInput}
                shouldExpandNode={(level, value, field) => {
                  const expand = level === 0 || field === "payload";
                  return expand;
                }}
              />
            </div>
            <div className="jsonMessage border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
              <h4 className="font-semibold mb-1">Responded with</h4>
              <JsonView
                data={lastServerMsg}
                shouldExpandNode={(level, value, field) => {
                  const expand = level === 0 || field === "payload";
                  return expand;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSandbox;
