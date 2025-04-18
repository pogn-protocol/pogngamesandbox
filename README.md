# POGN Games Sandbox
[POGN Games Sandbox Demo](https://pogngamesandbox-eac15b3c6192.herokuapp.com/)

Develop games for pogn straight out of the POGN Games Sandbox demo.

The idea here is causal coders and gamers could use a predefined prompt to create simple games.  Since the turn base play and general gameplay (ie rounds and roles) can be handled in base classes the "gameshell" provides a simple framework for a well prompted llm to create a simple game server/client pair for a custom game. Here the pogngamesandbox "wraps" the users input code with the necessary base classes to make such an arrangement work. 

Pogansandbox is meant to use base classes that [pognclient](https://github.com/pogn-protocol/pognclient) uses so the games that work here should plug-and-play with the real pognclient.

Pognsandbox can evolve to be a general development tool for more complex games.

![image](https://github.com/user-attachments/assets/d488bdc5-e781-468e-ae7f-e905a45d974e)

# Prompt

(Here's a chatGTP demo with this below prompted with the files: [https://chatgpt.com/share/67ffd19c-b790-8002-983f-909435ee76f7](https://chatgpt.com/share/67ffd19c-b790-8002-983f-909435ee76f7))

> Note: This prompting is more of a novelty.  Its not expected to be able to produce complex games or games more complex than the existing llms however it could help drive the development path and provide a fun interface for non or hobby coders and/or game designers or nostr users.

Users should enter the files referenced into the llm prompt as well.

## pognClient console

The pognClient console is wrapped with the [gameShell](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/utils/GameShell.jsx) and provides an interface to the pognServer console using the props: ```sendGameMessage, gameState, playerId, gameId```. 

sendGameMessage should be structured like this:

```sendGameMessage({```
 ``` gameAction: "yourAction",```
 ``` playerId,```
 ``` gameId,```
 ``` ... // your custom fields like index, choice, number, etc.```
```});```

The framework provides a messaging gui for sent and recivied msgs to and from the pognServer console.

Export your GameComponent like this: ```const defaultExport = GameComponent;```

You have access to the react library by using React.<>

Imports aren't supported inline with the code atm (imports using the gui is working or is expected to soon).

Tailwind.css is provided.

## pognServer Console

The pognServer console will extend either the [base](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/utils/baseGame.js) or the [turnBased](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/utils/turnBasedGame.js) (turnBased extends base) game class thus providing the gameplay framework chosen by the user before they hit the run button on the pogngamesandbox main gui. 

Remember then there are base methods and properties avaiable, implict, that the user will choose before runtime.

The gameSandbox expects a nodejs export syntax like this: ```module.exports = RockPaperScissors;```

The game server file should return msgs in this format:

```return {```
 ``` gameAction: "roundCompleted",```
```  ...this.getGameDetails(),```
```  winner: this.winner,```
```  private: { yourChoice },```
```};```

## Examples

### pognClient Examples

-[ticTacToe client](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/ticTacToeClient.jsx)

-[rock, paper, scissors client](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/rpsClient.jsx)

-[odds and evens client](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/initialClientCode.jsx)

### pognServer Examples

-[ticTacToe server](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/ticTacToeServer.jsx)

-[rock, paper, scissors server](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/rpsServer.jsx)

-[odds and evens server](https://github.com/pogn-protocol/pogngamesandbox/blob/master/src/initialServerCode.jsx)

