import { useEffect, useState } from "react";
import Playzone from "./playzone";
import { WebSocketHook } from "react-use-websocket/dist/lib/types";
import styled from "styled-components";
import { ClientMessage, UserMessage } from "../App";

export type GameMessage = {
  key: "token-drop" | "has-winner";
  value: string;
};
type Position = {
  isEmpty: boolean;
  yCoord: number;
  xCoord: number;
  ownerUuid?: string;
  owner?: string;
};
type Player = {
  uuid: string;
  name: string;
  lastUserMessage: UserMessage;
  currentGridId: string;
};
type GridState = {
  ySize: number;
  xSize: number;
  grid: Position[][];
  gridReady: boolean;
  gridUuid: string;
  firstPlayer: Player;
  secondPlayer: Player | null;
  nextPlayer: Player;
  nbTurns: number;
  winner: string | null;
  lastPlayedPosition: Position;
};

const PositionContainer = styled.div.attrs<{ color: string; size: number }>(
  (props) => ({
    style: {
      backgroundColor: props.color,
      width: props.size + "vw",
      height: props.size + "vw",
    },
  })
)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
`;

type GridProps = {
  size: [number, number];
  playerName: string;
  websocket: WebSocketHook<unknown, MessageEvent<any> | null>;
};
const Grid = ({ size, playerName, websocket }: GridProps) => {
  const [gridSize, setGridSize] = useState([0, 0]);
  const [winner, setWinner] = useState<string | null>(null);
  const [gridState, setGridState] = useState<GridState>({
    firstPlayer: {
      currentGridId: "",
      lastUserMessage: {},
      name: "",
      uuid: "",
    },
    grid: [],
    gridUuid: "",
    gridReady: false,
    lastPlayedPosition: {
      isEmpty: false,
      xCoord: 0,
      yCoord: 0,
    },
    nbTurns: 0,
    secondPlayer: null,
    nextPlayer: {
      currentGridId: "",
      lastUserMessage: {},
      name: "",
      uuid: "",
    },
    winner: null,
    xSize: 0,
    ySize: 0,
  });

  useEffect(() => {
    setGridSize([size[0], size[1]]);
  }, [size]);

  useEffect(() => {
    const clientMsg = websocket.lastJsonMessage as ClientMessage;
    if (clientMsg && clientMsg.type === "token-drop") {
      const gridState = JSON.parse(clientMsg.message as string) as GridState;
      if (gridState !== null) setGridState(gridState);
    }

    if (clientMsg && clientMsg.type === "winner") {
      setWinner(`${clientMsg.message}`);
      setTimeout(
        () =>
          alert(
            `${clientMsg.message} is the WINNER ! \n Recharge pour créer une nouvelle partie`
          ),
        500
      );
    }
  }, [websocket.lastJsonMessage]);

  const onTokenDrop = (col: number) => {
    const message: GameMessage = {
      key: "token-drop",
      value: "" + col,
    };
    websocket.sendJsonMessage({ type: "game", message });
  };

  return (
    <div className="grid-container">
      {!gridState.gridReady && <p>En attente d'un deuxième joueur</p>}
      {!winner && gridState.gridReady && gridState.nextPlayer && (
        <p>A ton tour {gridState.nextPlayer.name} !</p>
      )}
      <Playzone
        onDrop={onTokenDrop}
        gridSize={gridSize}
        disabled={!!winner || gridState.nextPlayer.name !== playerName}
        tokenSize={Math.floor(75 / gridSize[0])}
      ></Playzone>
      <div className="grid">
        {gridState.grid.length > 0 &&
          gridState.gridReady &&
          Array(gridSize[1])
            .fill(0)
            .map((_, indexRow) => {
              return (
                <div className="grid-row-container" key={"row" + indexRow}>
                  {Array(gridSize[0])
                    .fill(0)
                    .map((_, indexCol) => {
                      return (
                        <PositionContainer
                          key={`col-${indexCol}-row-${indexRow}`}
                          size={Math.floor(75 / gridSize[0])}
                          color={
                            gridState.grid[indexCol][indexRow].owner ===
                            playerName
                              ? "rgb(26 159 237)"
                              : gridState.grid[indexCol][indexRow].owner !==
                                  null
                                ? "rgb(255 125 125)"
                                : "white"
                          }
                          className={
                            gridState.grid[indexCol][indexRow].owner !== null
                              ? "drop-it position-container"
                              : "position-container"
                          }
                        ></PositionContainer>
                      );
                    })}
                </div>
              );
            })}
      </div>
    </div>
  );
};
export default Grid;
