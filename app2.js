const express = require("express")
const socket = require("socket.io")
const http = require("http")
const { Chess } = require("chess.js")
const path = require("path")


const userRouter = require('./routes/user.routes')
const dotenv = require('dotenv')
dotenv.config()
const connectToDB = require('./config/db')
connectToDB()
const cookieParser = require('cookie-parser')


const app = express()

// const cookieParser = require('cookie-parser')
app.use(cookieParser()) //Set the cookie-parser middleware


app.use(express.json()) //Express middleware for reading post method body[3rd party middleware]
app.use(express.urlencoded({ extended: true })) //Express middleware for reading post method body[3rd party middleware]



//INFO: Socket.io Initialization:
const server = http.createServer(app)
const io = socket(server)


// //INFO: Chess initialization
// const chess = new Chess()
// let players = {}
// let currentPlayer = "W"
// let gameReady = false;

const rooms = {
    chess: new Chess(),
    players: {},
    currentPlayer: "W",
    gameReady: false,
    spectators: []
}


let playerInfo = {
    white: null,
    black: null
};



app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public"))) //INFO: this allows you to use static files like css,js

app.use('/user', userRouter)

app.get("/index", (req, res) => {
    res.render("index", { title: "Chess Game" })
})

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/first", (req, res) => {
    const username = req.query.username || "Guest"; // fallback if not provided
    res.render("first", { username });
})

io.on("connection", (uniquesocket) => {
    console.log('Connected');

    // uniquesocket.on("joinGame", ({ username }) => {
    //     uniquesocket.username = username
    //     if (!players.white) {
    //         players.white = uniquesocket.id;
    //         playerInfo.white = username
    //         uniquesocket.emit("playerRole", "w");

    //     } else if (!players.black) {
    //         players.black = uniquesocket.id;
    //         playerInfo.black = username
    //         uniquesocket.emit("playerRole", "b");

    //         // Both players are now connected
    //         gameReady = true;

    //         // Share usernames between players
    //         io.to(players.white).emit("opponentInfo", { opponent: playerInfo.black });
    //         io.to(players.black).emit("opponentInfo", { opponent: playerInfo.white });

    //         // Notify both players that the game is ready
    //         uniquesocket.to(players.white).emit("gameReady");
    //         uniquesocket.to(players.black).emit("gameReady");
    //     } else {
    //         uniquesocket.emit("spectatorRole");
    //     }
    // })


    uniquesocket.on("joinRoom", ({ username, roomId }) => {
        uniquesocket.username = username;
        uniquesocket.roomId = roomId;

        if (!rooms[roomId]) {
            rooms[roomId] = {
                chess: new Chess(),
                players: {},
                playerInfo: { white: null, black: null },
                gameReady: false,
                spectators: []
            };
        }

        const room = rooms[roomId];

        // Assign player roles
        if (!room.players.white) {
            room.players.white = uniquesocket.id;
            room.playerInfo.white = username;
            uniquesocket.emit("playerRole", "w");
        } else if (!room.players.black) {
            room.players.black = uniquesocket.id;
            room.playerInfo.black = username;
            uniquesocket.emit("playerRole", "b");

            room.gameReady = true;

            // Notify both players
            io.to(room.players.white).emit("opponentInfo", { opponent: room.playerInfo.black });
            io.to(room.players.black).emit("opponentInfo", { opponent: room.playerInfo.white });

            io.to(room.players.white).emit("gameReady");
            io.to(room.players.black).emit("gameReady");
        } else {
            room.spectators.push(uniquesocket.id);
            uniquesocket.emit("spectatorRole");
            // ✅ Send current board state to spectator
            uniquesocket.emit("boardState", room.chess.fen());
        }

        uniquesocket.join(roomId);

        // Broadcast room update
        io.to(roomId).emit("roomUpdate", {
            players: room.playerInfo,
            spectators: room.spectators.map(id => io.sockets.sockets.get(id)?.username || "Spectator")
        });
    });




    // uniquesocket.on("disconnect", () => {
    //     if (uniquesocket.id === players.white) {
    //         delete players.white
    //         playerInfo.white = null;
    //     } else if (uniquesocket.id === players.black) {
    //         delete players.black
    //         playerInfo.black = null;
    //     }
    //     gameReady = false;
    //     chess.reset();
    //     io.emit("gameReset");
    // })



    uniquesocket.on("disconnect", () => {
        const roomId = uniquesocket.roomId;
        const room = rooms[roomId];
        if (!room) return;

        if (uniquesocket.id === room.players.white) {
            delete room.players.white;
            room.playerInfo.white = null;
        } else if (uniquesocket.id === room.players.black) {
            delete room.players.black;
            room.playerInfo.black = null;
        } else {
            room.spectators = room.spectators.filter(id => id !== uniquesocket.id);
        }

        room.gameReady = false;
        room.chess.reset();

        io.to(roomId).emit("gameReset");
    });



    


    uniquesocket.on("move", (move) => {
        const roomId = uniquesocket.roomId;
        const room = rooms[roomId];
        if (!room || !room.gameReady) {
            uniquesocket.emit("gameNotReady");
            return;
        }

        const chess = room.chess;
        try {

            if (chess.turn() === 'w' && uniquesocket.id !== room.players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== room.players.black) return;

            const result = chess.move(move);
            if (result) {
                io.to(roomId).emit("move", move);
                io.to(roomId).emit("boardState", chess.fen());
            } else {
                uniquesocket.emit("Invalid Move", move);
            }
        } catch(err){
            console.log(err);
            uniquesocket.emit("Invalid Move: ", move)
        }
    });



})

server.listen(3000, () => {
    console.log("Server is running");
})