import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import GameSandbox from "./GameSandbox";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <GameSandbox />
    </>
  );
}

export default App;
