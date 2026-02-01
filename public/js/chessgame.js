const socket = io()
const chess = new Chess()
const boardElement = document.querySelector(".chessboard")

let draggerPiece = null
let sourceSquare = null
let playerRole = null
let hasInteracted = false;

const username = new URLSearchParams(window.location.search).get("username") || "Guest";
const roomId = new URLSearchParams(window.location.search).get("room") || "default-room";

const movesList = document.getElementById("moves-list");
const gameStatus = document.getElementById("game-status");
const rankLabelsContainer = document.getElementById("rank-labels");
const fileLabelsContainer = document.getElementById("file-labels");

const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalIcon = document.getElementById('modal-icon');
const closeModalBtn = document.getElementById('close-modal-btn');

const moveSelf = document.getElementById('move-self');
const moveOpponent = document.getElementById('move-opponent');
const illegal = document.getElementById('illegal');
const gameStart = document.getElementById('game-start');
const gameEnd = document.getElementById('game-end');
const promote = document.getElementById('promote');
const capture = document.getElementById('capture');
const check = document.getElementById('check');

const startButton = document.getElementById('start-button');
const startOverlay = document.getElementById('start-game-overlay');

startButton.addEventListener('click', () => {
    if (!hasInteracted) {
        hasInteracted = true;
        startOverlay.classList.add('hidden');
        socket.emit("joinRoom", { username, roomId });
        if (gameStart) gameStart.play();
    }
});

const playSound = (audioElement) => {
    if (hasInteracted && audioElement) {
        audioElement.play().catch(e => console.error("Audio playback failed:", e));
    }
};

const renderBoard = () => {
    const board = chess.board()
    boardElement.innerHTML = ""

    const isFlipped = playerRole === "b";
    const ranks = isFlipped ? ["1", "2", "3", "4", "5", "6", "7", "8"] : ["8", "7", "6", "5", "4", "3", "2", "1"];
    const files = isFlipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];

    if (rankLabelsContainer && fileLabelsContainer) {
        rankLabelsContainer.innerHTML = ranks.map(rank => `<div class="h-1/8 flex items-center justify-center">${rank}</div>`).join('');
        fileLabelsContainer.innerHTML = files.map(file => `<div class="w-1/8 flex items-center justify-center">${file}</div>`).join('');
    }

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div")
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            )

            const file = String.fromCharCode(97 + squareindex);
            const rank = 8 - rowindex;
            squareElement.dataset.square = `${file}${rank}`;

            if (square) {
                const pieceElement = document.createElement("div")
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                )
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggerPiece = pieceElement
                        sourceSquare = squareElement.dataset.square
                        e.dataTransfer.setData("text/plain", "")
                    }
                })

                pieceElement.addEventListener("dragend", (e) => {
                    draggerPiece = null
                    sourceSquare = null
                })

                squareElement.appendChild(pieceElement)
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault()
            })

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault()
                if (draggerPiece) {
                    const targetSquare = squareElement.dataset.square
                    handleMove(sourceSquare, targetSquare)
                }
            })
            boardElement.appendChild(squareElement)
        })
    })

    if (playerRole === 'b') {
        boardElement.classList.add("flipped")
    } else {
        boardElement.classList.remove("flipped")
    }
}


const handleMove = (source, target) => {
    const move = {
        from: source,
        to: target,
        promotion: 'q'
    }
    const turn = chess.turn();
    if (playerRole !== turn) {
        Toastify({
            text: "Opponent's Turn!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ff9800",
            theme: "dark",
        }).showToast();
        return;
    }
    document.getElementById("turn-indicator").innerText =
        turn === playerRole ? "Your turn" : "Opponent's turn";

    playSound(moveSelf);

    socket.emit("move", move)
}


const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
        k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: '♟︎'
    }
    return unicodePieces[piece.type] || ""
}

// const updateMovesList = (history) => {
//     if (!movesList) return;
//     movesList.innerHTML = "";

//     const gridContainer = document.createElement("div");
//     gridContainer.className = "grid grid-cols-[30px_1fr_1fr] gap-x-5";

//     const headers = ["", "White", "Black"];
//     headers.forEach(headerText => {
//         const header = document.createElement("div");
//         header.textContent = headerText;
//         header.className = "font-bold text-center mt-2";
//         gridContainer.appendChild(header);
//     });

//     history.forEach((move, index) => {
//         if (index % 2 === 0) {
//             const moveNumber = Math.floor(index / 2) + 1;

//             const moveNumberDiv = document.createElement("div");
//             moveNumberDiv.textContent = `${moveNumber}.`;
//             moveNumberDiv.className = "text-center";
//             gridContainer.appendChild(moveNumberDiv);

//             const whiteMoveDiv = document.createElement("div");
//             whiteMoveDiv.textContent = move;
//             whiteMoveDiv.className = "text-center py-1 rounded-md";
//             if (index === history.length - 1) {
//                 whiteMoveDiv.classList.add("bg-zinc-700", "text-white");
//             }
//             gridContainer.appendChild(whiteMoveDiv);

//             const blackMoveDiv = document.createElement("div");
//             if (history[index + 1]) {
//                 blackMoveDiv.textContent = history[index + 1];
//                 blackMoveDiv.className = "text-center py-1 rounded-md";
//                 if (index + 1 === history.length - 1) {
//                     blackMoveDiv.classList.add("bg-zinc-700", "text-white");
//                 }
//             } else {
//                 blackMoveDiv.textContent = "";
//             }
//             gridContainer.appendChild(blackMoveDiv);
//         }
//     });

//     movesList.appendChild(gridContainer);
//     movesList.scrollTop = movesList.scrollHeight;
// };

const updateMovesList = (history) => {
    if (!movesList) return;
    movesList.innerHTML = "";

    const gridContainer = document.createElement("div");
    gridContainer.className = "grid grid-cols-[30px_1fr_1fr] gap-x-4 gap-y-1";

    // Header row
    ["#", "White", "Black"].forEach(text => {
        const header = document.createElement("div");
        header.textContent = text;
        header.className = "font-bold text-white";
        gridContainer.appendChild(header);
    });

    for (let i = 0; i < history.length; i += 2) {
        const moveNumber = document.createElement("div");
        moveNumber.textContent = `${Math.floor(i / 2) + 1}.`;
        moveNumber.className = "text-zinc-400";
        gridContainer.appendChild(moveNumber);

        const whiteMove = document.createElement("div");
        whiteMove.textContent = history[i];
        whiteMove.className = "text-white";
        gridContainer.appendChild(whiteMove);

        const blackMove = document.createElement("div");
        blackMove.textContent = history[i + 1] || "";
        blackMove.className = "text-white";
        gridContainer.appendChild(blackMove);
    }

    movesList.appendChild(gridContainer);
    movesList.scrollTop = movesList.scrollHeight;
};


socket.on("playerRole", (role) => {
    playerRole = role
    renderBoard()
    updateTurnIndicator()
});

socket.on("spectatorRole", () => {
    playerRole = null
    document.getElementById("opponent-name").classList.add("hidden");
    document.getElementById("opponent").classList.add("hidden");
    document.getElementById("turn-indicator").classList.add("hidden");
    document.getElementById("turn").classList.add("hidden");
    document.getElementById("spectator-info").classList.remove("hidden");
    updateTurnIndicator()
});

socket.on("boardState", (fen) => {
    chess.load(fen)
    renderBoard()
    const turn = chess.turn();
    const turnText = turn === 'w' ? 'White' : 'Black';
    document.getElementById("spectator-turn").textContent = turnText;
    updateTurnIndicator()
});

socket.on("moveMade", (data) => {
    chess.load(data.fen);

    const isCheck = chess.in_check();
    const isMate = chess.in_checkmate();
    const isDraw = chess.in_draw() || chess.in_stalemate() || chess.insufficient_material();

    if (isMate) {
        playSound(gameEnd);
    } else if (isCheck) {
        playSound(check);
    } else {
        const lastMove = chess.history({ verbose: true }).pop();
        if (lastMove && lastMove.color !== playerRole) {
            playSound(moveOpponent);
        }
    }

    renderBoard();
    updateMovesList(data.history);

    if (isMate || isDraw) {
        let message = "";
        let title = "";
        let icon = "";
        let titleColor = "";

        const winner = isMate ? (playerRole !== chess.turn() ? username : null) : null;
        socket.emit("gameEnded", {
            roomId,
            winner,
            moves: chess.history(),
            isDraw
        });

        if (isMate) {
            const isWinner = (playerRole !== chess.turn());
            title = isWinner ? "You Won!" : "You Lost";
            titleColor = isWinner ? "text-green-500" : "text-red-500";
            message = isWinner ? "Congratulations, you have defeated your opponent!" : "Your opponent has delivered checkmate.";
            icon = isWinner ? "👑" : "💀";
        } else if (isDraw) {
            title = "Game Drawn!";
            titleColor = "text-yellow-500";
            message = "The game ended in a draw.";
            icon = "🤝";
        }

        if (playerRole) {
            modalTitle.textContent = title;
            modalTitle.className = `text-4xl font-extrabold ${titleColor} animate-pulse mb-2`;
            modalMessage.textContent = message;
            modalIcon.textContent = icon;
            gameOverModal.classList.remove('hidden');
            setTimeout(() => {
                gameOverModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
                gameOverModal.querySelector('div').classList.add('scale-100', 'opacity-100');
            }, 10);
        }
    }
});

socket.on("Invalid Move", (move) => {
    Toastify({
        text: "Invalid Move",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#e31515ff",
        theme: "dark",
    }).showToast();
    playSound(illegal);
});

socket.on("connect", () => {
    Toastify({
        text: "Welcome to the Chess Game!",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#4CAF50",
    }).showToast();
});

socket.on("playerRole", (role) => {
    const roleText = role === "w" ? "White" : "Black";
    Toastify({
        text: `You are playing as ${roleText}`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: role === "w" ? "#2196F3" : "#373926ff",
    }).showToast();
});

socket.on("spectatorRole", () => {
    Toastify({
        text: "You are watching as a Spectator",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#9E9E9E",
    }).showToast();
});

socket.on("gameNotReady", () => {
    Toastify({
        text: "Opponent is not ready",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#e7e12eff",
    }).showToast();
});

socket.on("opponentInfo", ({ opponent }) => {
    Toastify({
        text: `Your opponent is ${opponent}`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ff9800",
    }).showToast();
    document.getElementById("opponent-name").innerText = `${opponent}`;
});

socket.on("roomUpdate", ({ players, spectators }) => {
    document.getElementById("spectator-count").innerText = `${spectators.length}`;
    document.getElementById("player1-name").textContent = players.white || "Waiting...";
    document.getElementById("player2-name").textContent = players.black || "Waiting...";
});

document.getElementById("username-display").innerText = `${username}`;
document.getElementById("room-display").innerText = `${roomId}`;

const playAgainBtn = document.getElementById("playAgainBtn");
if (playAgainBtn) {
    playAgainBtn.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = `/first?username=${encodeURIComponent(username)}`;
    });
}

closeModalBtn.addEventListener('click', () => {
    gameOverModal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        gameOverModal.classList.add('hidden');
    }, 300);
});

const updateTurnIndicator = () => {
    const turn = chess.turn();
    const indicator = document.getElementById("turn-indicator");
    if (indicator) {
        if (turn === 'w') {
            indicator.innerText = "White's turn";
            indicator.classList.remove("text-yellow-500");
            indicator.classList.add("text-green-500");
        } else {
            indicator.innerText = "Black's turn";
            indicator.classList.remove("text-green-500");
            indicator.classList.add("text-yellow-500");
        }
    }
};

renderBoard()