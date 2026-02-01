// const express = require("express");
// const socket = require("socket.io");
// const http = require("http");
// const { Chess } = require("chess.js");
// const path = require("path");

// const userRouter = require('./routes/user.routes');
// const dotenv = require('dotenv');
// dotenv.config();
// const connectToDB = require('./config/db');
// connectToDB();
// const cookieParser = require('cookie-parser');
// const Game = require('./model/Game'); // Import the new Game model

// const app = express();
// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const server = http.createServer(app);
// const io = socket(server);

// const rooms = {};

// app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, "public")));

// app.use('/user', userRouter);

// app.get("/index", (req, res) => {
//     res.render("index", { title: "Chess Game" });
// });

// app.get("/", (req, res) => {
//     res.render("home");
// });

// app.get("/first", (req, res) => {
//     const username = req.query.username || "Guest";
//     const roomId = req.query.room || `room-${Math.floor(Math.random() * 1000)}`;
//     res.render("first", { username, roomId });
// });

// // New route to display game history
// app.get("/history", async (req, res) => {
//     const username = req.query.username;
//     if (!username) {
//         return res.status(400).send("Username is required to view history.");
//     }

//     try {
//         const history = await Game.find({
//             $or: [{ player1Name: username }, { player2Name: username }]
//         }).sort({ date: -1 });

//         res.render("history", { username, history });
//     } catch (err) {
//         console.error("Error fetching game history:", err);
//         res.status(500).send("Server Error");
//     }
// });

// io.on("connection", (uniquesocket) => {
//     console.log('Connected');

//     uniquesocket.on("joinRoom", ({ username, roomId }) => {
//         uniquesocket.username = username;
//         uniquesocket.roomId = roomId;

//         if (!rooms[roomId]) {
//             rooms[roomId] = {
//                 chess: new Chess(),
//                 players: {},
//                 playerInfo: { white: null, black: null },
//                 gameReady: false,
//                 spectators: []
//             };
//         }

//         const room = rooms[roomId];

//         if (!room.players.white) {
//             room.players.white = uniquesocket.id;
//             room.playerInfo.white = username;
//             uniquesocket.emit("playerRole", "w");
//         } else if (!room.players.black) {
//             room.players.black = uniquesocket.id;
//             room.playerInfo.black = username;
//             uniquesocket.emit("playerRole", "b");

//             room.gameReady = true;

//             io.to(room.players.white).emit("opponentInfo", { opponent: room.playerInfo.black });
//             io.to(room.players.black).emit("opponentInfo", { opponent: room.playerInfo.white });

//             io.to(room.players.white).emit("gameReady");
//             io.to(room.players.black).emit("gameReady");
//         } else {
//             room.spectators.push(uniquesocket.id);
//             uniquesocket.emit("spectatorRole");
//             uniquesocket.emit("boardState", room.chess.fen());
//         }

//         uniquesocket.join(roomId);

//         io.to(roomId).emit("roomUpdate", {
//             players: room.playerInfo,
//             spectators: room.spectators.map(id => io.sockets.sockets.get(id)?.username || "Spectator")
//         });
//     });

//     uniquesocket.on("disconnect", () => {
//         const roomId = uniquesocket.roomId;
//         const room = rooms[roomId];
//         if (!room) return;

//         if (uniquesocket.id === room.players.white) {
//             delete room.players.white;
//             room.playerInfo.white = null;
//         } else if (uniquesocket.id === room.players.black) {
//             delete room.players.black;
//             room.playerInfo.black = null;
//         } else {
//             room.spectators = room.spectators.filter(id => id !== uniquesocket.id);
//         }

//         room.gameReady = false;
//         room.chess.reset();
//         io.to(roomId).emit("gameReset");
//     });

//     uniquesocket.on("move", (move) => {
//         const roomId = uniquesocket.roomId;
//         const room = rooms[roomId];
//         if (!room || !room.gameReady) {
//             uniquesocket.emit("gameNotReady");
//             return;
//         }

//         const chess = room.chess;
//         try {
//             if (chess.turn() === 'w' && uniquesocket.id !== room.players.white) return;
//             if (chess.turn() === 'b' && uniquesocket.id !== room.players.black) return;

//             const result = chess.move(move);
//             if (result) {
//                 const gameHistory = chess.history();
//                 io.to(roomId).emit("moveMade", {
//                     fen: chess.fen(),
//                     history: gameHistory
//                 });
//             } else {
//                 uniquesocket.emit("Invalid Move", move);
//             }
//         } catch (err) {
//             console.log(err);
//             uniquesocket.emit("Invalid Move: ", move);
//         }
//     });

//     // New event listener to save game history
//     uniquesocket.on("gameEnded", async (data) => {
//         const { roomId, winner, moves, isDraw } = data;
//         const room = rooms[roomId];

//         if (!room) return;

//         const result = isDraw ? 'draw' : (winner === room.playerInfo.white ? 'win' : 'loss');
//         const winnerName = isDraw ? null : winner;

//         const newGame = new Game({
//             player1Name: room.playerInfo.white,
//             player2Name: room.playerInfo.black,
//             result: result,
//             winnerName: winnerName,
//             moves: moves
//         });

//         try {
//             await newGame.save();
//             console.log("Game history saved successfully!");
//         } catch (err) {
//             console.error("Error saving game history:", err);
//         }
//     });
// });

// server.listen(3000, () => {
//     console.log("Server is running");
// });
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
const Game = require('./model/Game'); // Mongoose model

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

// ✅ History route
app.get("/history", async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).send("Username is required");

    try {
        const history = await Game.find({ owner: username }).sort({ date: -1 });
        res.render("history", { username, history });
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).send("Server Error");
    }
});

io.on("connection", (socket) => {
    console.log('Connected');

    socket.on("joinRoom", ({ username, roomId }) => {
        socket.username = username;
        socket.roomId = roomId;

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
            room.players.white = socket.id;
            room.playerInfo.white = username;
            socket.emit("playerRole", "w");
        } else if (!room.players.black) {
            room.players.black = socket.id;
            room.playerInfo.black = username;
            socket.emit("playerRole", "b");

            room.gameReady = true;

            io.to(room.players.white).emit("opponentInfo", { opponent: room.playerInfo.black });
            io.to(room.players.black).emit("opponentInfo", { opponent: room.playerInfo.white });

            io.to(room.players.white).emit("gameReady");
            io.to(room.players.black).emit("gameReady");
        } else {
            room.spectators.push(socket.id);
            socket.emit("spectatorRole");
            socket.emit("boardState", room.chess.fen());
        }

        socket.join(roomId);

        io.to(roomId).emit("roomUpdate", {
            players: room.playerInfo,
            spectators: room.spectators.map(id => io.sockets.sockets.get(id)?.username || "Spectator")
        });
    });

    socket.on("disconnect", () => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room) return;

        if (socket.id === room.players.white) {
            delete room.players.white;
            room.playerInfo.white = null;
        } else if (socket.id === room.players.black) {
            delete room.players.black;
            room.playerInfo.black = null;
        } else {
            room.spectators = room.spectators.filter(id => id !== socket.id);
        }

        room.gameReady = false;
        room.chess.reset();
        io.to(roomId).emit("gameReset");
    });

    socket.on("move", (move) => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room || !room.gameReady) {
            socket.emit("gameNotReady");
            return;
        }

        const chess = room.chess;
        try {
            if (chess.turn() === 'w' && socket.id !== room.players.white) return;
            if (chess.turn() === 'b' && socket.id !== room.players.black) return;

            const result = chess.move(move);
            if (result) {
                const gameHistory = chess.history();
                io.to(roomId).emit("moveMade", {
                    fen: chess.fen(),
                    history: gameHistory
                });
            } else {
                socket.emit("Invalid Move", move);
            }
        } catch (err) {
            console.log(err);
            socket.emit("Invalid Move", move);
        }
    });

    // ✅ Save game history
    socket.on("gameEnded", async ({ roomId, winner, moves, isDraw }) => {
        const room = rooms[roomId];
        if (!room || room.gameSaved) return;

        room.gameSaved = true;

        const white = room.playerInfo.white;
        const black = room.playerInfo.black;

        const resultWhite = isDraw ? "draw" : winner === white ? "win" : "loss";
        const resultBlack = isDraw ? "draw" : winner === black ? "win" : "loss";

        const gameDataWhite = {
            player1Name: white,
            player2Name: black,
            result: resultWhite,
            winnerName: isDraw ? null : winner,
            moves,
            owner: white
        };

        const gameDataBlack = {
            player1Name: white,
            player2Name: black,
            result: resultBlack,
            winnerName: isDraw ? null : winner,
            moves,
            owner: black
        };

        try {
            await Game.create([gameDataWhite, gameDataBlack]);
            console.log("Game history saved for both players!");
        } catch (err) {
            console.error("Error saving game:", err);
        }
    });

});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
