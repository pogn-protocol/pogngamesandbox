import React, { useState } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const GameSandbox = () => {
  const [clientCode, setClientCode] = useState(`
// Define your component using JSX:
function GameComponent({ sendToServer, lastServerMessage }) {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => sendToServer({ count })}>Send to Server</button>
      {lastServerMessage && (
        <p>Server said: {JSON.stringify(lastServerMessage)}</p>
      )}
    </div>
  );
}
`);

  const [serverCode, setServerCode] = useState(`
// A fake server that echoes the message
function handleServerMessage(msg) {
  console.log("Server received:", msg);
  return { echoed: msg };
}
`);

  const [Component, setComponent] = useState(null);
  const [lastServerInput, setLastServerInput] = useState(null);
  const [lastServerMsg, setLastServerMsg] = useState(null);
  const [lastClientInput, setLastClientInput] = useState(null);
  const [lastClientMsg, setLastClientMsg] = useState(null);

  const handleRun = () => {
    console.log("▶️ Running sandbox...");

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
      //   const transpiled = Babel.transform(clientCode, {
      //     presets: ["react"],
      //   }).code;
      const transpiled = Babel.transform(clientCode, {
        presets: ["react"],
      }).code;
      console.log("✅ Transpiled code:", transpiled);

      console.log("⚙️ Creating component...");
      const createComponent = new Function(
        "React",
        "sendToServer",
        "lastServerMessage",
        `${transpiled}; return GameComponent;`
      );

      const EvaluatedComponent = createComponent(
        React,
        sendToServer,
        lastServerMsg
      );

      console.log("✅ Component created:", EvaluatedComponent);
      setComponent(() => EvaluatedComponent);
      console.log("🎉 Sandbox execution complete!");
    } catch (err) {
      console.error("🔥 Top-level error in handleRun:", err);
      alert("Failed to run code. Check console.");
    }
  };
  console.log("🖼️ Rendering GameSandbox", { Component });

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="p-4 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-center text-xl font-bold rounded shadow-lg">
        ✅ Tailwind is working!
      </div>

      {/* Code Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold mb-2">Client Code</h2>
          <textarea
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            className="w-full h-64 p-2 font-mono bg-gray-900 text-green-300 rounded"
            spellCheck={false}
          />
        </div>
        <div>
          <h2 className="font-bold mb-2">Server Code</h2>
          <textarea
            value={serverCode}
            onChange={(e) => setServerCode(e.target.value)}
            className="w-full h-64 p-2 font-mono bg-gray-900 text-blue-300 rounded"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Run Game
      </button>

      {Component ? (
        <Component
          sendToServer={(msg) => {
            console.log("📤 Realtime sendToServer triggered with:", msg);
            try {
              setLastClientInput(msg);
              setLastServerInput(msg);
              const response = new Function(
                `${serverCode}; return handleServerMessage;`
              )()(msg);
              setLastServerMsg(response);
              setLastClientMsg(response);
            } catch (err) {
              console.error("❌ Realtime send error:", err);
              setLastServerMsg({ error: err.message });
              setLastClientMsg({ error: err.message });
            }
          }}
          lastServerMessage={lastServerMsg}
        />
      ) : (
        <p className="text-gray-500">Run a game to see it here.</p>
      )}

      {/* Render Game */}
      {(lastClientInput ||
        lastClientMsg ||
        lastServerInput ||
        lastServerMsg) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Client Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md mb-2">Client</h3>
            <div className="jsonMessage border rounded p-2 bg-gray-100">
              <h4 className="font-semibold text-sm mb-1">Sent to Server</h4>
              <JsonView
                data={lastClientInput}
                shouldExpandNode={(level) => level === 0}
                style={{ fontSize: "14px", lineHeight: "1.2" }}
              />
            </div>
            <div className="jsonMessage border rounded p-2 bg-gray-100">
              <h4 className="font-semibold text-sm mb-1">
                Received from Server
              </h4>
              <JsonView
                data={lastClientMsg}
                shouldExpandNode={(level) => level === 0}
                style={{ fontSize: "14px", lineHeight: "1.2" }}
              />
            </div>
          </div>

          {/* Server Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md mb-2">Server</h3>
            <div className="jsonMessage border rounded p-2 bg-gray-100">
              <h4 className="font-semibold text-sm mb-1">
                Received from Client
              </h4>
              <JsonView
                data={lastServerInput}
                shouldExpandNode={(level) => level === 0}
                style={{ fontSize: "14px", lineHeight: "1.2" }}
              />
            </div>
            <div className="jsonMessage border rounded p-2 bg-gray-100">
              <h4 className="font-semibold text-sm mb-1">Responded with</h4>
              <JsonView
                data={lastServerMsg}
                shouldExpandNode={(level) => level === 0}
                style={{ fontSize: "14px", lineHeight: "1.2" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSandbox;
