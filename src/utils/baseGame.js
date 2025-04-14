class BaseGame {
  constructor(options = {}) {
    this.players = new Map();
    this.roles = {}; // playerId -> role
    this.minPlayers = options.minPlayers || 0;
    this.maxPlayers = options.maxPlayers || 0;
    this.gameStatus = "waiting";
    this.gameLog = [];
    this.round = 1;
    if (!options.rounds) {
      throw new Error("Rounds not defined");
    }
    console.log("[BaseGame] Rounds:", options.rounds);
    this.rounds = options.rounds;
  }

  assignRolesShuffled(roleList) {
    const playerIds = Array.from(this.players.keys());
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    shuffled.forEach((id, i) => {
      this.roles[id] = roleList[i];
    });
    this.gameStatus = "in-progress";
    console.log("[assignRolesShuffled] Assigned roles:", this.roles);
    return this.roles;
  }

  logAction(action) {
    console.log("[BaseGame] logAction called with:", action);
    if (action?.logEntry) {
      console.log("[GameLog]", action.logEntry);
    }
    this.gameLog.push(action);
  }

  getRolesResponse(playerId) {
    const response = {
      gameAction: "rolesAssigned",
      roles: this.roles,
      gameStatus: this.gameStatus,
      private: `You are ${this.roles[playerId]}`,
    };
    console.log("[BaseGame] getRolesResponse:", response);
    this.logAction?.(response);
    return response;
  }

  getGameDetails() {
    console.log("[BaseGame] getGameDetails called.");
    return {
      roles: this.roles,
      gameStatus: this.gameStatus,
      gameLog: this.gameLog,
      rounds: this.rounds,
      round: this.round,
    };
  }

  nextRound() {
    console.log("[BaseGame] nextRound called.");
    if (this.rounds && this.round >= this.rounds) {
      console.log("[BaseGame] Maximum rounds reached, ending game.");
      this.gameStatus = "complete";
      return;
    }
    this.round++;
    this.gameStatus = "in-progress";
    console.log(
      "[BaseGame] Next round:",
      this.round,
      "Game status:",
      this.gameStatus
    );
  }
}

export default BaseGame;
