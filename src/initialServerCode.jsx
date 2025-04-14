class OddsAndEvens {
  constructor() {
    this.choices = {};
    this.rolesAssigned = false;
  }

  assignGameRoles() {
    const ids = Object.keys(this.roles);
    if (ids.length === 2 && !this.rolesAssigned) {
      const [p1, p2] = ids;
      this.roles[p1] = "odd";
      this.roles[p2] = "even";
      this.rolesAssigned = true;
      console.log("[OddsAndEvens] Roles:", this.roles);
    }
  }

  processAction(playerId, payload) {
    console.log("[OddsAndEvens] processAction playerId:", playerId, payload);
    const { gameAction, number } = payload;

    if (!this.rolesAssigned && Object.keys(this.players).length === 2) {
      this.assignGameRoles?.();
    }

    if (gameAction !== "submitNumber") {
      return {
        playerId,
        type: "error",
        action: "gameError",
        message: "Unknown action",
      };
    }

    this.choices[playerId] = number;

    const ids = Object.keys(this.roles);
    if (ids.every((id) => this.choices[id] !== undefined)) {
      const total = this.choices[ids[0]] + this.choices[ids[1]];
      const isEven = total % 2 === 0;
      const winner = ids.find(
        (id) => this.roles[id] === (isEven ? "even" : "odd")
      );
      const loser = ids.find((id) => id !== winner);

      return {
        [ids[0]]: {
          type: "game",
          action: "gameAction",
          message: `${winner === ids[0] ? "You win!" : "You lose!"}`,
          yourChoice: this.choices[ids[0]],
          opponentChoice: this.choices[ids[1]],
          winner,
          sum: total,
        },
        [ids[1]]: {
          type: "game",
          action: "gameAction",
          message: `${winner === ids[1] ? "You win!" : "You lose!"}`,
          yourChoice: this.choices[ids[1]],
          opponentChoice: this.choices[ids[0]],
          winner,
          sum: total,
        },
      };
    }

    return {
      playerId,
      type: "game",
      action: "gameAction",
      message: "Number submitted. Waiting for opponent...",
      yourChoice: number,
    };
  }
}

const defaultExport = OddsAndEvens;
