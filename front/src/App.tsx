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
  const WS_URL = process.env.REACT_APP_WS_URL || "ws://127.0.0.1:8000";
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
    <div className="app">
      <header className="app-header">
        <h1>PUISSANCE 4</h1>
      </header>
      <div className="app-status">
        { isConnected ?
          <div className="app-connected-indicator"></div>
          :
          <div className="app-disconnected-indicator"></div>
        }
      </div>
      <main className="app-main">
        {!gameStarted && (
          <div className="app-connection-form">
            <input type='text' placeholder='Entez votre nom de joueur' onChange={(form)=>setPlayerName(form.target.value)}></input>
            <input type='submit' value='Commencer une partie' onClick={startGame} disabled={!playerName}/>
          </div>
        )}
        {gameStarted && (
          <div>
            <Grid playerName={playerName} size={gridSize} websocket={websocket}></Grid>
          </div>
        )}
      </main>
      <div className="app-dashboard">{playerName}</div>
    </div>
  );
}

export default App;
