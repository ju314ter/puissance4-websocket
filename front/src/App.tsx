import { useEffect, useState } from 'react';
import './App.css';
import Grid from './components/grid';
import useWebSocket from 'react-use-websocket';

export type UserMessage = {
  username?: string;
  loginState?: boolean;
  gameInfos?: {
    hasStartedGame: boolean;
    gridSize: [number, number];
  };
}

export type ClientMessage = {
  type: 'user' | 'token-drop' | 'winner',
  message: unknown
}

function App() {
  const [playerName, setPlayerName] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const gridSize: [number,number] = [7,6];
  const WS_URL = process.env.WS_URL || "ws://127.0.0.1:8000";
  const websocket = useWebSocket(WS_URL, {
    share: true
  })

  useEffect(()=>{
    const clientMsg = websocket.lastJsonMessage as ClientMessage;
    if(clientMsg && clientMsg.type === 'user') {
      if(clientMsg.message === 'connected') setIsConnected(true)
    }
  }, [websocket.lastJsonMessage])

  const startGame = () => {
    setGameStarted(true)
    const message: UserMessage = {
      gameInfos: {
        hasStartedGame: true,
        gridSize
      },
      loginState: true,
      username: playerName
    }
    websocket.sendJsonMessage({type:'user', message})
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>PUISSANCE 4</h1>
        <p>{isConnected ? 'connecté': 'déconnecté'}</p>
        {!gameStarted && (
          <div>
            <input type='text' placeholder='Entez votre nom de joueur' onChange={(form)=>setPlayerName(form.target.value)}></input>
            <input type='submit' value='Commencer une partie' onClick={startGame} disabled={!playerName}/>
          </div>
        )}
        {gameStarted && (
          <div>
            <p>{playerName}</p>
            <Grid playerName={playerName} size={gridSize} websocket={websocket}></Grid>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
