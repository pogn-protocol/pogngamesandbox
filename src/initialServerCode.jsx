class CounterGame {
  constructor() {
    this.totals = {};
  }

  processAction(playerId, payload) {
    console.log("processAction", playerId, payload);
    console.log("this.totals", this.totals);

    let { count = 0 } = payload;

    if (!count || isNaN(count)) {
      console.log("Invalid count value:", count);
      count = Number(count) || 0;
    }

    if (!this.totals[playerId]) this.totals[playerId] = 0;
    this.totals[playerId] += count;

    const grandTotal = Object.values(this.totals).reduce((sum, n) => sum + n, 0);
console.log("Grand Total:", grandTotal);
    return {
      playerId,
      type: "game",
      action: "gameAction",
      playerTotal: this.totals[playerId],
      allTotals: { ...this.totals },
      grandTotal,
    };
  }
}

const defaultExport = CounterGame;
