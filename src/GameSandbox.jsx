// REFACTORED GameSandbox with per-player state, clean transpile hook, and imported initial client/server code

import React, { useState, useRef } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { defaultClientCode, defaultServerCode } from "./initialCode";
import CollapsedJson from "./components/CollapsedJson";
import loadExternalScripts from "./utils/loadExternalScripts";
import useTranspiledComponent from "./hooks/useTranspiledComponent";
import * as firmware from "./utils/serverFirmware";
globalThis.__firmware = firmware;

const GameSandbox = () => {
  const componentRef = useRef(null);
  const { transpile } = useTranspiledComponent();

  const [clientCode, setClientCode] = useState(defaultClientCode);
  const [serverCode, setServerCode] = useState(defaultServerCode);
  const [PlayerGameComponent, setPlayerGameComponent] = useState(null);
  const [playerStates, setPlayerStates] = useState({});
  const [numPlayers, setNumPlayers] = useState(2);
  const [userImports, setUserImports] = useState([]);
  const [turnBased, setTurnBased] = useState(true);
  const [useMaxRounds, setUseMaxRounds] = useState(true);
  const [maxRounds, setMaxRounds] = useState(2);

  const handleRun = async () => {
    await loadExternalScripts(userImports.filter(Boolean));
    try {
      //   const serverFn = new Function(
      //     `${serverCode}; return handleServerMessage;`
      //   )();
      //   const serverFn = new Function(
      //     `${serverCode}; return { handleServerMessage, initServer };`
      //   )();

      //       const firmwareHeader = `
      //   const serverState = globalThis.__firmware.serverState;
      //   const initServer = globalThis.__firmware.initServer;
      //   const broadcastToAllPlayers = globalThis.__firmware.broadcastToAllPlayers;
      // `;
      const firmwareHeader = `
  const serverState = globalThis.__firmware.serverState;
  const initServer = globalThis.__firmware.initServer;
  const broadcastToAllPlayers = globalThis.__firmware.broadcastToAllPlayers;
  const updatePlayerData = globalThis.__firmware.updatePlayerData;
`;

      const fullServerCode = `${firmwareHeader}\n${serverCode}\nreturn { handleServerMessage, initServer };`;
      const serverFn = new Function(fullServerCode)();
      // serverFn.initServer(Array.from({ length: numPlayers }, (_, i) => i + 1));
      const initialBroadcast = serverFn.initServer(
        Array.from({ length: numPlayers }, (_, i) => i + 1),
        turnBased,
        useMaxRounds ? maxRounds : null
      );

      if (initialBroadcast && typeof initialBroadcast === "object") {
        setPlayerStates((prev) => {
          const newStates = { ...prev };
          for (const pid in initialBroadcast) {
            newStates[pid] = {
              lastInput: null,
              lastResponse: initialBroadcast[pid],
            };
          }
          return newStates;
        });
      }

      const EvaluatedComponent = await transpile(
        clientCode,
        ["React", "sendGameMessage", "gameState", "playerId", "gameId"],
        [React, () => {}, {}, 0, ""]
      );

      componentRef.current = EvaluatedComponent;
      setPlayerGameComponent(() => componentRef.current);

      const sendToServer = ({ playerId, relayId, payload }) => {
        console.log("Sending to server:", payload, playerId, relayId);
        if (!payload || !playerId || !relayId) {
          console.warn("Invalid payload:", payload, playerId, relayId);
        }
        try {
          const res = serverFn.handleServerMessage(payload); // ✅ correct

          // const res = serverFn(payload);
          //   setPlayerStates((prev) => ({
          //     ...prev,
          //     [playerId]: {
          //       lastInput: payload,
          //       lastResponse: res,
          //     },
          //   }));

          if (res && typeof res === "object") {
            setPlayerStates((prev) => {
              const newStates = { ...prev };
              for (const pid in res) {
                newStates[pid] = {
                  lastInput:
                    pid == playerId ? payload : newStates[pid]?.lastInput,
                  lastResponse: res[pid],
                };
              }
              return newStates;
            });
          }
        } catch (err) {
          const errorBroadcast = {};
          for (let id in playerStates) {
            errorBroadcast[id] = {
              type: "error",
              payload: {
                error: err.message,
                triggeredBy: playerId,
                youAre: Number(id),
              },
            };
          }

          setPlayerStates((prev) => {
            const newStates = { ...prev };
            for (const pid in errorBroadcast) {
              newStates[pid] = {
                lastInput:
                  pid == playerId ? payload : newStates[pid]?.lastInput,
                lastResponse: errorBroadcast[pid],
              };
            }
            return newStates;
          });

          //   const error = { error: err.message };
          //   setPlayerStates((prev) => ({
          //     ...prev,
          //     [playerId]: {
          //       lastInput: payload,
          //       lastResponse: error,
          //     },
          //   }));
        }
      };
      window.sendToServer = sendToServer;
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
        <label className="font-semibold ms-4">Turn-Based:</label>
        <input
          type="checkbox"
          checked={turnBased}
          onChange={(e) => setTurnBased(e.target.checked)}
          className="w-5 h-5"
        />
        <label className="font-semibold">Max Rounds:</label>
        <input
          type="checkbox"
          checked={useMaxRounds}
          onChange={(e) => setUseMaxRounds(e.target.checked)}
          className="w-5 h-5"
        />
        <input
          type="number"
          min={1}
          value={maxRounds}
          onChange={(e) => setMaxRounds(Number(e.target.value))}
          className="w-20 px-2 py-1 border rounded"
          disabled={!useMaxRounds}
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
                    window.sendToServer({
                      relayId: "default",
                      playerId,
                      payload: { ...msg },
                    })
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
            ([playerId, { lastInput, lastResponse }]) => (
              <div key={playerId}>
                <h3 className="font-semibold">Player {playerId}</h3>
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
