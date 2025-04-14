class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null); // 3x3 board
    this.players = new Map(); // filled in by firmware
    this.currentTurn = null;
    this.winner = null;
    this.movesMade = 0;
  }

  assignRoles() {
    const ids = Array.from(this.players.keys());
    if (ids.length < 2) throw new Error("TicTacToe needs 2 players.");
    this.currentTurn = ids[0];
    this.roles = {
      [ids[0]]: "X",
      [ids[1]]: "O",
    };
  }

  checkWinner() {
    const b = this.board;
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];
    for (let [a, bIdx, c] of lines) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
    }
    return null;
  }

  processAction(playerId, payload) {
    console.log("[TicTacToe] processAction:", playerId, payload);
    console.log("[TicTacToe] Current turn:", this.currentTurn);
    if (this.currentTurn === null) {
      throw new Error("Game not initialized. Call assignRoles first.");
    }
    const { gameAction, index } = payload;
    if (gameAction !== "makeMove")
      return { type: "error", message: "Unknown action." };

    if (this.winner) return { message: "Game is over." };
    if (this.currentTurn !== playerId) return { message: "Not your turn." };

    const mark = this.roles[playerId];
    if (this.board[index]) return { message: "Cell already taken." };

    this.board[index] = mark;
    this.movesMade += 1;

    const winnerMark = this.checkWinner();
    if (winnerMark) {
      const winnerId = Object.keys(this.roles).find(
        (id) => this.roles[id] === winnerMark
      );
      this.winner = winnerId;
    } else if (this.movesMade >= 9) {
      this.winner = "draw";
    } else {
      console.log("[TicTacToe] No winner yet, moves made:", this.movesMade);
      console.log("[TicTacToe] Current turn:", this.currentTurn);
      // const ids = Array.from(this.players.keys());
      // const next = ids.find((id) => id !== this.currentTurn);
      // this.currentTurn = next;
      this.switchTurn?.(); // ⬅️ Call the shared turn logic
      console.log("[TicTacToe] Next turn:", this.currentTurn);
    }

    return {
      playerId,
      type: "game",
      action: "gameAction",
      board: [...this.board],
      currentTurn: this.currentTurn,
      winner: this.winner,
      message: this.winner
        ? this.winner === "draw"
          ? "It's a draw!"
          : `Player ${this.winner} wins!`
        : `Player ${playerId} made a move.`,
    };
  }
}

const defaultExport = TicTacToe;
