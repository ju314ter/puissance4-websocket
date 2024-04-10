"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const ws_1 = require("ws");
const UUID = __importStar(require("uuid"));
// import * as SocketIO from 'socket.io'
const express_1 = __importDefault(require("express"));
const classes_1 = require("./classes");
class Server {
    constructor(port) {
        this.port = port;
        console.log("Construction du server sur le port " + port);
    }
    start() {
        const app = (0, express_1.default)();
        app.get("/", (req, res) => {
            res.send("Salut les gens");
        });
        app.listen(this.port, function () {
            console.log("serveur demarré");
        });
    }
    startWwebsockets() {
        const port = this.port;
        const app = (0, express_1.default)();
        const server = http.createServer(app);
        const wssServer = new ws_1.WebSocketServer({ server });
        const connectionsCollection = {};
        const connectedUsersCollection = {};
        const gameGridCollection = {};
        const handleMessage = (bytes, uuid, connections) => {
            //TODO: check integrity of data before parsing => wrong format = server crash
            const payload = JSON.parse(bytes.toString());
            const player = connectedUsersCollection[uuid];
            const connection = connections[uuid];
            switch (payload.type) {
                case "game":
                    handleGameMessage(payload.message, player, gameGridCollection, connections);
                    break;
                case "user":
                    handleUserMessage(payload.message, player, gameGridCollection, connections, connection);
                    break;
                default:
                    console.log("Unrecognized message type");
            }
        };
        const handleClose = (uuid) => {
            delete connectionsCollection[uuid];
            delete connectedUsersCollection[uuid];
            console.log(uuid + " disconnected");
            //TODO : broadcast to client about loss of connection from a user
        };
        console.log("Démarrage websocket sur le port " + port);
        app.get("/", (req, res) => {
            res.send("Salut le monde");
        });
        wssServer.on("connection", (connection, request) => {
            console.log(request.url);
            const uuid = UUID.v4();
            console.log("connected player with id ", uuid);
            connectionsCollection[uuid] = connection;
            connectedUsersCollection[uuid] = new classes_1.Player(uuid);
            const msg = { type: "user", message: "connected" };
            connection.send(JSON.stringify(msg));
            connection.on("message", (message) => handleMessage(message, uuid, connectionsCollection));
            connection.on("close", () => handleClose(uuid));
        });
        server.listen(port, function () {
            console.log("serveur websocket demarré || port : " + port);
        });
    }
}
exports.default = Server;
function handleGameMessage(message, player, gameGridCollection, connections) {
    const gameMessage = message;
    console.log("New game event !", player.name, gameMessage);
    if (gameMessage.key === "token-drop") {
        // get user grid and drop token
        const grid = gameGridCollection[player.currentGridId] || null;
        grid && grid.dropToken(player, Number(gameMessage.value));
        // check if that was a winning move
        if (grid.isLastDropWinningPlay()) {
            console.log("winning play !");
            const clientMsg = { type: "winner", message: player.name };
            connections[grid.firstPlayer.uuid] &&
                connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg));
            connections[grid.secondPlayer.uuid] &&
                connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg));
            // TODO : informs clients of result and delete grid from user state
        }
        // send message to both players with last grid position
        const clientMsg = {
            type: "token-drop",
            message: JSON.stringify(grid),
        };
        connections[grid.firstPlayer.uuid] &&
            connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg));
        connections[grid.secondPlayer.uuid] &&
            connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg));
        // if last play is a winning play, send information to client
    }
}
function handleUserMessage(message, player, gameGridCollection, connections, connection) {
    var _a;
    const userMessage = message;
    player.updateLastUserMessage(userMessage);
    if ((_a = userMessage.gameInfos) === null || _a === void 0 ? void 0 : _a.hasStartedGame) {
        console.log(`Player ${player.name} is trying to start a game`);
        // Check if collection has a grid waiting
        let hasGridWaiting = false;
        Object.keys(gameGridCollection).forEach((key) => {
            const grid = gameGridCollection[key];
            if (grid.firstPlayer !== null && grid.secondPlayer === null)
                hasGridWaiting = true;
        });
        if (hasGridWaiting) {
            // a grid is waiting, let's retrieve it then add a second player to it
            Object.keys(gameGridCollection).forEach((key) => {
                const grid = gameGridCollection[key];
                if (grid.firstPlayer !== null && grid.secondPlayer === null) {
                    grid.addSecondPlayer(player);
                    player.setCurrentGrid(grid.gridUuid);
                }
                console.log("Adding second player to grid ", grid.gridUuid);
                // si la grille est prête, envoyer les infos au client pour démarrer la partie
                if (grid.gridReady) {
                    console.log("Grid ready");
                    const clientMsg = {
                        type: "token-drop",
                        message: JSON.stringify(grid),
                    };
                    if (connections[grid.secondPlayer.uuid])
                        connections[grid.secondPlayer.uuid].send(JSON.stringify(clientMsg));
                    if (connections[grid.firstPlayer.uuid])
                        connections[grid.firstPlayer.uuid].send(JSON.stringify(clientMsg));
                }
            });
        }
        else {
            // create new grid with user as firstplayer and send inital infos to him
            const gridUuid = UUID.v4();
            const newGrid = new classes_1.Grid(userMessage.gameInfos.gridSize, player, gridUuid);
            gameGridCollection[gridUuid] = newGrid;
            player.setCurrentGrid(newGrid.gridUuid);
            const clientMsg = {
                type: "token-drop",
                message: JSON.stringify(newGrid),
            };
            connection.send(JSON.stringify(clientMsg));
            console.log("Game created, waiting for second player on grid", newGrid.gridUuid);
        }
    }
}
