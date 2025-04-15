import { useEffect, useState } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

// ✅ Universal local game state hook (game-specific shape is set initially by the component)
export function useLocalGameState(gameId, incomingState) {
  const [localGameState, setLocalGameState] = useState({ gameId });

  useEffect(() => {
    if (!incomingState) return;
    console.log(`${gameId} incoming game state changed`, incomingState);

    setLocalGameState((prev) => ({
      ...prev,
      ...incomingState,
    }));
  }, [incomingState]);

  return [localGameState, setLocalGameState];
}

// ✅ Handles requesting roles and storing your assigned role based on local game state only
export function useRoleRequester(
  localGameState,
  playerId,
  gameId,
  sendGameMessage
) {
  const [roleRequested, setRoleRequested] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (role || roleRequested) return;

    const rolesMissing =
      !localGameState?.roles || Object.keys(localGameState.roles).length < 2;

    if (rolesMissing) {
      console.log(`${gameId} requesting roles...`);
      sendGameMessage({
        payload: {
          type: "game",
          action: "gameAction",
          gameAction: "getRoles",
          playerId,
          gameId,
        },
      });
      setRoleRequested(true);
    }
  }, [localGameState, playerId, gameId, sendGameMessage, role, roleRequested]);

  useEffect(() => {
    if (
      localGameState?.gameAction === "rolesAssigned" &&
      localGameState.roles?.[playerId] &&
      !role
    ) {
      setRole(localGameState.roles[playerId]);
    }
  }, [localGameState, playerId, role]);

  return role;
}

export const GameResultDisplay = ({ localGameState, playerId }) => {
  if (localGameState?.gameStatus !== "complete") return null;

  const winner = localGameState?.winner;
  const winnerRole = localGameState?.roles?.[winner] || winner || "Unknown";

  return (
    <div className="bg-white p-4 rounded shadow text-center">
      {winner ? (
        winner === playerId ? (
          <p className="text-green-600 font-bold">You win!</p>
        ) : (
          <p className="text-red-600 font-bold">You lose! {winnerRole} wins.</p>
        )
      ) : (
        <p className="text-yellow-600 font-bold">It's a draw!</p>
      )}
    </div>
  );
};

// ✅ Dev-only JSON debugger for local vs raw states
export const GameJsonDebug = ({ sentToServer, receivedFromServer }) => (
  <div>
    <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
      <h4 className="font-semibold">Sent to Server</h4>
      <JsonView
        data={sentToServer}
        shouldExpandNode={(level, value, type) =>
          level === 0 || type === "payload"
        }
        style={{ fontSize: "14px", lineHeight: "1.2" }}
      />
    </div>

    <div className="border rounded p-2 bg-gray-100 text-[12px] leading-[1.2] text-left">
      <h4 className="font-semibold">Received from Server</h4>
      <JsonView
        data={receivedFromServer}
        shouldExpandNode={(level, value, type) =>
          level === 0 || type === "payload"
        }
        style={{ fontSize: "14px", lineHeight: "1.2" }}
      />
    </div>
  </div>
);
