import React, { useState, useRef } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { defaultClientCode, defaultServerCode } from "./initialCode";
import CollapsedJson from "./components/CollapsedJson";
import loadExternalScripts from "./utils/loadExternalScripts";
import useTranspiledComponent from "./hooks/useTranspiledComponent";
import * as gameController from "./utils/gameController";
import { wrapGameComponent } from "./utils/GameShell";
import * as gameUtils from "./utils/gameUtils";
import BaseGame from "./utils/baseGame";
import TurnBasedGame from "./utils/turnBasedGame";

const {
  useLocalGameState,
  useRoleRequester,
  GameResultDisplay,
  GameJsonDebug,
} = gameUtils;

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
  const [useRounds, setUseRounds] = useState(false);
  const [rounds, setRounds] = useState(2);

  const handleRun = async () => {
    await loadExternalScripts(userImports.filter(Boolean));
    try {
      const strippedServerCode = serverCode.replace(/export\s+default\s+/g, "");
      const module = { exports: {} };
      const exports = module.exports;

      new Function("exports", "module", `"use strict";\n${strippedServerCode}`)(
        exports,
        module
      );

      const UserGameLogic = module.exports?.default || module.exports;

      if (!UserGameLogic || typeof UserGameLogic !== "function") {
        throw new Error(
          "Missing or invalid default export. You must export a class using `export default class MyGame {}` or `module.exports = class MyGame {}`."
        );
      }

      function createAutoGameClass(UserGameLogic, turnBased = false) {
        console.log("Creating AutoGame class with turnBased:", turnBased);
        const ParentGame = turnBased ? TurnBasedGame : BaseGame;

        return class AutoGame extends ParentGame {
          constructor(options) {
            super(options || {});

            const userInstance = new UserGameLogic(options);
            Object.assign(this, userInstance); // copy fields

            // Temporarily replace prototype with user's methods + super chain
            const baseProto = Object.getPrototypeOf(this);
            const userProto = Object.getPrototypeOf(userInstance);
            const combinedProto = Object.create(baseProto);

            // Copy only user-defined methods
            for (const key of Object.getOwnPropertyNames(userProto)) {
              if (
                key !== "constructor" &&
                typeof userProto[key] === "function"
              ) {
                combinedProto[key] = userProto[key];
              }
            }

            Object.setPrototypeOf(this, combinedProto);
          }
        };
      }
      const GameClass = createAutoGameClass(UserGameLogic, turnBased);
      console.log("useRounds", useRounds, "rounds", rounds);

      const flatOptions = turnBased
        ? {
            baseGameOptions: {
              minPlayers: numPlayers,
              maxPlayers: numPlayers,
              rounds: useRounds ? rounds : Infinity,
            },
            roleList: Array.from({ length: numPlayers }, (_, i) =>
              String(i + 1)
            ),
          }
        : {
            minPlayers: numPlayers,
            maxPlayers: numPlayers,
            rounds: useRounds ? rounds : Infinity,
            roleList: Array.from({ length: numPlayers }, (_, i) =>
              String(i + 1)
            ),
          };

      gameController.initGame({
        players: Array.from({ length: numPlayers }, (_, i) => String(i + 1)),
        GameClass,
        // options: {
        //   baseGameOptions: {
        //     minPlayers: numPlayers,
        //     maxPlayers: numPlayers,
        //     rounds: useRounds ? rounds : "Infinity", // this line is doing exactly what we need
        //     msg: "test",
        //   },
        //   roleList: Array.from({ length: numPlayers }, (_, i) => String(i + 1)),
        // },
        options: flatOptions,
      });

      const instance = gameController.gameState.gameInstance;
      let result = {};
      if (instance && typeof instance.init === "function") {
        const initResult = instance.init();
        const playerIds = Array.from(instance.players.keys());

        for (const id of playerIds) {
          result[id] = {
            payload: {
              type: "game",
              action: "gameAction",
              playerId: id,
              youAre: id,
              role: instance.roles?.[id],
              ...(initResult || {}),
            },
          };
        }
      }

      if (result && typeof result === "object") {
        setPlayerStates(() => {
          const newStates = {};
          for (const pid of Object.keys(result)) {
            newStates[pid] = {
              lastInput: null,
              lastResponse: result[pid]?.payload || {},
            };
          }
          return newStates;
        });
      }

      const EvaluatedComponent = await transpile(
        clientCode,
        [
          "React",
          "sendGameMessage",
          "gameState",
          "playerId",
          "gameId",
          "useLocalGameState",
          "useRoleRequester",
          "GameResultDisplay",
          "GameJsonDebug",
        ],
        [
          React,
          () => {},
          {},
          0,
          "",
          useLocalGameState,
          useRoleRequester,
          GameResultDisplay,
          GameJsonDebug,
        ]
      );

      if (!EvaluatedComponent) {
        throw new Error(
          "Missing defaultExport = YourReactComponent in client code."
        );
      }

      const WrappedComponent = wrapGameComponent(EvaluatedComponent);
      componentRef.current = WrappedComponent;
      setPlayerGameComponent(() => componentRef.current);

      const sendToServer = ({ relayId, payload }) => {
        console.log("sendToServer", { relayId, payload });
        const { playerId } = payload || {};
        try {
          const res = gameController.processGameMessage({ payload });
          console.log("Server response:", res);
          if (res && typeof res === "object") {
            setPlayerStates((prev) => {
              const newStates = { ...prev };
              for (const pid in res) {
                if (!pid || pid === "undefined") continue;
                newStates[pid] = {
                  lastInput:
                    pid === playerId ? payload : newStates[pid]?.lastInput,
                  lastResponse: res[pid]?.payload || {},
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
                youAre: id,
              },
            };
          }
          setPlayerStates((prev) => {
            const newStates = { ...prev };
            for (const pid in errorBroadcast) {
              newStates[pid] = {
                lastInput:
                  pid === playerId ? payload : newStates[pid]?.lastInput,
                lastResponse: errorBroadcast[pid]?.payload || {},
              };
            }
            return newStates;
          });
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
        <label className="font-semibold">Rounds:</label>
        <input
          type="checkbox"
          checked={useRounds}
          onChange={(e) => setUseRounds(e.target.checked)}
          className="w-5 h-5"
        />

        {useRounds && (
          <>
            <label className="font-semibold">Rounds:</label>
            <input
              type="number"
              min={1}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-20 px-2 py-1 border rounded"
            />
          </>
        )}
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
            const playerId = String(i + 1);
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
                  sendGameMessage={(msg) => {
                    console.log(
                      "🎮 sendGameMessage from Player",
                      playerId,
                      msg
                    );
                    window.sendToServer({
                      relayId: "default",
                      playerId,
                      payload: { ...msg },
                    });
                  }}
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
                {/* <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold">Sent to Server</h4>
                  <CollapsedJson data={lastInput} />
                </div>
                <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
                  <h4 className="font-semibold">Received from Server</h4>
                  <CollapsedJson data={lastResponse} />
                </div> */}

                {/* <GameResultDisplay
                  gameState={lastResponse}
                  playerId={playerId}
                /> */}
                <GameJsonDebug
                  sentToServer={lastInput}
                  receivedFromServer={lastResponse}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GameSandbox;
