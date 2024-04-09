import { Response, Request } from 'express';
import * as http from 'http';
import { RawData, WebSocketServer  } from 'ws';
import * as UUID from 'uuid';
import * as URL from 'url'
// import * as SocketIO from 'socket.io'
import express from 'express';
import { ClientMessage, GameMessage, Grid, Player, UserMessage, WSMessage } from './classes';

export default class Server {

    readonly port: number;
    constructor(port: number) {
        this.port = port
        console.log('Construction du server sur le port ' + port)
    }

    start () {
        const app = express()
        app.get('/', (req: Request, res: Response)=>{
            res.send('Salut les gens')
        })
        app.listen(this.port, function(){
            console.log('serveur demarré')
        })
    }

    startWwebsockets () {
        const port = this.port
        const app = express()
        const server = http.createServer(app);
        const wssServer = new WebSocketServer({ server });
        const connectionsCollection = {};
        const connectedUsersCollection: Record<string, Player> = {};
        const gameGridCollection: Record<string, Grid> = {}

        const handleMessage = (bytes: RawData, uuid: string, connections) => {
            //TODO: check integrity of data before parsing => wrong format = server crash
            const payload: WSMessage = JSON.parse(bytes.toString())
            const player: Player = connectedUsersCollection[uuid];
            const connection: WebSocket = connections[uuid];

            switch (payload.type) {
                case 'game':
                    const gameMessage = <GameMessage>payload.message;
                    console.log('New game event !', player.name, gameMessage)

                    if(gameMessage.key === 'token-drop') {
                        // get user grid and drop token
                        const grid: Grid = gameGridCollection[player.currentGridId];
                        grid.dropToken(player, Number(gameMessage.value));
                        // check if that was a winning move
                        if(grid.isLastDropWinningPlay()) {
                            console.log('winning play !')
                            const clientMsg: ClientMessage = {type: 'winner', message: player.name}
                            connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg));
                            connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg));
                            // TODO : informs clients of result and delete grid from user state
                        }
                        // send message to both players with last grid position
                        const clientMsg: ClientMessage = {type: 'token-drop', message: JSON.stringify(grid)}
                        connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg));
                        if (connections[grid.secondPlayer.uuid]) connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg));
                        // if last play is a winning play, send information to client
                    }
                    break;
                case 'user':
                    const userMessage = <UserMessage>payload.message;
                    player.updateLastUserMessage(userMessage);

                    if(userMessage.gameInfos?.hasStartedGame) {
                        console.log(`Player ${player.name} is trying to start a game`)

                        // Check if collection has a grid waiting
                        let hasGridWaiting = false;
                        Object.keys(gameGridCollection).forEach((key)=> {
                            const grid: Grid = gameGridCollection[key];
                            if(grid.firstPlayer !== null && grid.secondPlayer === null) hasGridWaiting = true;
                        })

                        if(hasGridWaiting) {
                            // a grid is waiting, let's retrieve it then add a second player to it
                            Object.keys(gameGridCollection).forEach((key)=> {
                                const grid: Grid = gameGridCollection[key];
                                if(grid.firstPlayer !== null && grid.secondPlayer === null) {
                                    grid.addSecondPlayer(player);
                                    player.setCurrentGrid(grid.gridUuid)
                                };
                                console.log('Adding second player to grid ', grid.gridUuid)
                                // si la grille est prête, envoyer les infos au client pour démarrer la partie
                                if(grid.gridReady){ 
                                    console.log('Grid ready')
                                    const clientMsg: ClientMessage = {type: 'token-drop', message: JSON.stringify(grid)}
                                    if(connections[grid.secondPlayer.uuid]) connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg))
                                    if(connections[grid.firstPlayer.uuid]) connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg))
                                }
                            })
                        } else {
                            // create new grid with user as firstplayer and send inital infos to him
                            const gridUuid = UUID.v4();
                            const newGrid = new Grid(userMessage.gameInfos.gridSize, player, gridUuid);
                            gameGridCollection[gridUuid] = newGrid;
                            player.setCurrentGrid(newGrid.gridUuid)
                            const clientMsg: ClientMessage = {type: 'token-drop', message: JSON.stringify(newGrid)}
                            connection.send(JSON.stringify(clientMsg))
                            console.log('Game created, waiting for second player on grid', newGrid.gridUuid)
                        }
                    }
                    break;
                default:
                    console.log('Unrecognized message type')
            }
        }

        const handleClose = (uuid: string) => {
            delete connectionsCollection[uuid]
            delete connectedUsersCollection[uuid]
            console.log(uuid + ' disconnected')
            //TODO : broadcast to client about loss of connection from a user
        }

        console.log("Démarrage websocket sur le port " + port)


        app.get('/', (req: Request, res: Response)=>{
            res.send('Salut le monde')
        })

        wssServer.on('connection', (connection, request)=> {
            console.log(request.url)
            // const name = URL.parse(request.url, true).query.name?.toString() ?? 'error'
            const uuid = UUID.v4();
            console.log('connected player with id ', uuid)

            connectionsCollection[uuid] = connection
            connectedUsersCollection[uuid] = new Player(uuid)

            const msg: ClientMessage = {type:'user', message: 'connected'}
            connection.send(JSON.stringify(msg))

            // TODO : send feedback to client that user is connected

            connection.on('message', (message)=> handleMessage(message , uuid, connectionsCollection))
            connection.on('close', ()=> handleClose(uuid))
        })
        
        server.listen(port, function(){
            console.log('serveur websocket demarré || port : ' + port)
        })

    }
}

