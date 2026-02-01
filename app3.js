const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const userRouter = require('./routes/user.routes');
const dotenv = require('dotenv');
dotenv.config();
const connectToDB = require('./config/db');
connectToDB();
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = socket(server);

const rooms = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.use('/user', userRouter);

app.get("/index", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/first", (req, res) => {
    const username = req.query.username || "Guest";
    const roomId = req.query.room || `room-${Math.floor(Math.random() * 1000)}`;
    res.render("first", { username, roomId });
});

io.on("connection", (uniquesocket) => {
    console.log('Connected');

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

        if (!room.players.white) {
            room.players.white = uniquesocket.id;
            room.playerInfo.white = username;
            uniquesocket.emit("playerRole", "w");
        } else if (!room.players.black) {
            room.players.black = uniquesocket.id;
            room.playerInfo.black = username;
            uniquesocket.emit("playerRole", "b");

            room.gameReady = true;

            io.to(room.players.white).emit("opponentInfo", { opponent: room.playerInfo.black });
            io.to(room.players.black).emit("opponentInfo", { opponent: room.playerInfo.white });

            io.to(room.players.white).emit("gameReady");
            io.to(room.players.black).emit("gameReady");
        } else {
            room.spectators.push(uniquesocket.id);
            uniquesocket.emit("spectatorRole");
            uniquesocket.emit("boardState", room.chess.fen());
        }

        uniquesocket.join(roomId);

        io.to(roomId).emit("roomUpdate", {
            players: room.playerInfo,
            spectators: room.spectators.map(id => io.sockets.sockets.get(id)?.username || "Spectator")
        });
    });

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

           // const result = chess.move(move);
           const result = chess.move(move, { verbose: true });
            if (result) {
                const gameHistory = chess.history();
                io.to(roomId).emit("moveMade", {
                    fen: chess.fen(),
                    history: gameHistory
                });
            } else {
                uniquesocket.emit("Invalid Move", move);
            }
        } catch(err){
            // console.log(err);
            uniquesocket.emit("Invalid Move: ", move);
        }
    });
});

server.listen(3000, () => {
    console.log("Server is running");
}); 