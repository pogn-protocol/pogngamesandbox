// initialCode.js

//import defaultClientCode from "./initialClientCode.jsx?raw"; // 👈 Convert full JSX to string at import time
//import defaultServerCode from "./initialServerCode.jsx?raw"; // 👈 Convert full JSX to string at import time
import defaultClientCode from "./ticTacToeClient.jsx?raw"; // 👈 Convert full JSX to string at import tim
import defaultServerCode from "./ticTacToeServer.jsx?raw"; // 👈 Convert full JSX to string at import time

export { defaultClientCode, defaultServerCode };

// export const defaultClientCode = `
//   function GameComponent({ JsonView, sendGameMessage, gameState, playerId, gameId }) {
//     const [count, setCount] = React.useState(0);
//     const [gameStates, setGameStates] = React.useState([]);

//     React.useEffect(() => {
//       if (gameState) {
//         setGameStates((prev) => [...prev, gameState]);
//       }
//     }, [gameState]);

//     return (
//       <div className="p-4 bg-gray-100 rounded shadow space-y-4">
//         <div className="bg-blue-200 text-black text-center p-2 font-bold rounded">
//           🎮 Game Client Ready Player: ({playerId})
//         </div>

//         <p className="text-black text-lg">Count: {count}</p>

//         <div className="flex gap-2 flex-wrap">
//           <button
//             onClick={() => setCount(count + 1)}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//           >
//             +1
//           </button>

//           <button
//             onClick={() =>
//               sendGameMessage({
//                 payload: {
//                   type: "game",
//                   action: "gameAction",
//                   gameAction: "submitCount",
//                   count,
//                   playerId,
//                   gameId,
//                 },
//               })
//             }
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//           >
//             Send to Server
//           </button>
//         </div>

//         {gameStates.length > 0 && (
//           <>
//             {gameStates.map((state, index) => (
//               <div
//                 key={index}
//                 className="border rounded p-2 bg-gray-200 mb-2 text-[12px] leading-[1.2] text-left"
//               >
//                 <h4 className="font-semibold mb-1">Game State {index + 1}</h4>
//                 <JsonView data={state} shouldExpandNode={(l, v, f) => l === 0 || f === "payload"} />
//               </div>
//             ))}

//             <div className="border rounded p-2 bg-gray-200 mt-4 text-[12px] leading-[1.2] text-left">
//               <h4 className="font-semibold mb-1">All Game States</h4>
//               <JsonView data={gameStates} shouldExpandNode={(l, v, f) => l === 0 || f === "payload"} />
//             </div>
//           </>
//         )}
//       </div>
//     );
//   }
// `;

// export const defaultServerCode = `
// function handleServerMessage(msg) {
//   console.log("Server received:", msg);
//   return { ...msg };
// }
// `;
