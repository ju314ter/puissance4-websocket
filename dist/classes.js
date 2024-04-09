"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = exports.Position = exports.Player = void 0;
class Items {
    static getFirstItem() {
        return 'Item 1';
    }
}
exports.default = Items;
class Player {
    constructor(uuid) {
        this.uuid = uuid;
        this.lastUserMessage = null;
    }
    updateLastUserMessage(payload) {
        this.lastUserMessage = payload;
        this.name = payload.username;
    }
    setCurrentGrid(gridId) {
        this.currentGridId = gridId;
    }
    play(col) {
    }
}
exports.Player = Player;
class Position {
    constructor(x, y) {
        this.isEmpty = true;
        this.owner = null;
        this.ownerUuid = null;
        this.yCoord = y;
        this.xCoord = x;
    }
    assignOwner(playerUuid, playerName) {
        this.ownerUuid = playerUuid;
        this.owner = playerName;
        this.isEmpty = false;
    }
}
exports.Position = Position;
const getLastEmptyPositionInCol = (column) => {
    let lastEmptyIndex = null;
    for (let i = column.length - 1; i >= 0; i--) {
        if (column[i].isEmpty) {
            lastEmptyIndex = i;
            break;
        }
    }
    return lastEmptyIndex;
};
const buildGrid = (size) => {
    const nbRows = size[1];
    const nbColumns = size[0];
    // use map approach
    const gridMap = Array(nbColumns).fill(new Array(nbRows).fill({}));
    const initGrid = gridMap.map((column, iCol) => {
        return column.map((_, iRow) => new Position(iCol, iRow));
    });
    return initGrid;
};
class Grid {
    constructor(size, firstPlayerName, gridUuid) {
        var _a, _b;
        this.ySize = 7;
        this.xSize = 6;
        this.firstPlayer = null;
        this.secondPlayer = null;
        this.gridReady = false;
        this.winner = null;
        this.grid = [];
        this.nbTurns = 0;
        this.xSize = (_a = size[0]) !== null && _a !== void 0 ? _a : this.xSize;
        this.ySize = (_b = size[1]) !== null && _b !== void 0 ? _b : this.ySize;
        this.firstPlayer = firstPlayerName;
        this.nextPlayer = this.firstPlayer;
        this.gridUuid = gridUuid;
        this.grid = buildGrid(size);
    }
    addSecondPlayer(secondPlayer) {
        this.secondPlayer = secondPlayer;
        this.gridReady = true;
    }
    // Retourne vrai si token drop ou faux si coup impossible
    dropToken(player, col) {
        if (player.uuid !== this.nextPlayer.uuid) {
            console.log('another player tried to play, illegal move !');
            return false;
        }
        const column = this.grid[col];
        const lastEmptyPosition = getLastEmptyPositionInCol(column);
        if (lastEmptyPosition > 0) {
            this.grid[col][lastEmptyPosition].isEmpty = false;
            this.grid[col][lastEmptyPosition].ownerUuid = player.uuid;
            this.grid[col][lastEmptyPosition].owner = player.name;
            this.lastPlayedPosition = this.grid[col][lastEmptyPosition];
            this.nbTurns++;
            if (player.uuid === this.firstPlayer.uuid) {
                this.nextPlayer = this.secondPlayer;
            }
            else {
                this.nextPlayer = this.firstPlayer;
            }
            return true;
        }
        else {
            console.log('La colonne est pleine');
            return false;
            //TODO : envoyer message erreur au client, colonne pleine coup impossible
        }
    }
    isLastDropWinningPlay() {
        // 1) Verifier si un token du même proprietaire entour la dernière position jouée
        if (!this.lastPlayedPosition) {
            return false;
        }
        const { xCoord, yCoord, owner } = this.lastPlayedPosition;
        const gridWidth = this.grid.length;
        const gridHeight = this.grid[0].length;
        const potentialsNeighbours = [
            xCoord - 1 >= 0 ? this.grid[xCoord - 1][yCoord] : undefined,
            xCoord - 1 >= 0 && yCoord <= gridHeight ? this.grid[xCoord - 1][yCoord + 1] : undefined,
            xCoord - 1 >= 0 && yCoord >= 0 ? this.grid[xCoord - 1][yCoord - 1] : undefined,
            xCoord + 1 <= gridWidth ? this.grid[xCoord + 1][yCoord] : undefined,
            xCoord + 1 <= gridWidth && yCoord <= gridHeight ? this.grid[xCoord + 1][yCoord + 1] : undefined,
            xCoord + 1 <= gridWidth && yCoord >= 0 ? this.grid[xCoord + 1][yCoord - 1] : undefined,
            yCoord >= 0 ? this.grid[xCoord][yCoord - 1] : undefined,
            yCoord <= gridHeight ? this.grid[xCoord][yCoord + 1] : undefined,
        ];
        const neighbours = potentialsNeighbours.filter((pos) => pos && pos.owner === owner);
        let hasWinner = false;
        //  a) Si il des voisins, déterminer la direction des voisins
        if (!!neighbours.length) {
            const directions = neighbours.map((neighbour) => {
                const { xCoord: xCoordN, yCoord: yCoordN } = neighbour;
                return {
                    xDir: xCoordN - xCoord,
                    yDir: yCoordN - yCoord
                };
            });
            //  b) compter le nombre de token successif dans chaque direction pour chaque voisin
            const directionWithCount = directions.map((direction) => {
                let aligned = true;
                let i = 1;
                while (aligned) {
                    // On vérifie que les positions du jeton suivant sont biens inbound
                    const xPosToCheck = xCoord + i * direction.xDir >= 0 && xCoord + i * direction.xDir <= gridWidth ? xCoord + i * direction.xDir : null;
                    const yPosToCheck = yCoord + i * direction.yDir >= 0 && yCoord + i * direction.yDir <= gridHeight ? yCoord + i * direction.yDir : null;
                    const nextPositionToCheck = xPosToCheck !== null && yPosToCheck !== null ? this.grid[xPosToCheck][yPosToCheck] : null;
                    if (nextPositionToCheck && nextPositionToCheck.ownerUuid
                        ===
                            this.grid[xCoord][yCoord].ownerUuid) {
                        i++;
                    }
                    else {
                        aligned = false;
                    }
                }
                return Object.assign(Object.assign({}, direction), { count: i - 1 });
            });
            // ajouter les sommes des direction opposées, si somme > 3 alors c'est gagné !
            const sumsOfDirectionsArray = [0, 0, 0, 0];
            directionWithCount.forEach((el) => {
                const { xDir, yDir, count } = el;
                if (xDir === 0 && yDir === 1)
                    sumsOfDirectionsArray[0] += count;
                if (xDir === 0 && yDir === -1)
                    sumsOfDirectionsArray[0] += count;
                if (xDir === 1 && yDir === 0)
                    sumsOfDirectionsArray[1] += count;
                if (xDir === -1 && yDir === 0)
                    sumsOfDirectionsArray[1] += count;
                if (xDir === 1 && yDir === 1)
                    sumsOfDirectionsArray[2] += count;
                if (xDir === -1 && yDir === -1)
                    sumsOfDirectionsArray[2] += count;
                if (xDir === 1 && yDir === -1)
                    sumsOfDirectionsArray[3] += count;
                if (xDir === -1 && yDir === 1)
                    sumsOfDirectionsArray[3] += count;
            });
            if (sumsOfDirectionsArray.some(sum => sum >= 3))
                hasWinner = true;
        }
        return hasWinner;
    }
}
exports.Grid = Grid;
