const socket = io()
const chess = new Chess()
const boardElement = document.querySelector(".chessboard")

let draggerPiece = null
let sourceSquare = null
let playerRole = null

const username = new URLSearchParams(window.location.search).get("username") || "Guest";
const roomId = new URLSearchParams(window.location.search).get("room") || "default-room";

const movesList = document.getElementById("moves-list");
const gameStatus = document.getElementById("game-status");
const rankLabelsContainer = document.getElementById("rank-labels");
const fileLabelsContainer = document.getElementById("file-labels");


//INFO: for the pop-up page
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


socket.emit("joinRoom", { username, roomId });


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
    moveSelf.play()

    socket.emit("move", move)
}


const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
        k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: '♟︎'
    }
    return unicodePieces[piece.type] || ""
}

const updateMovesList = (history) => {
    if (!movesList) return;
    movesList.innerHTML = "";

    // Create a container with a grid layout
    const gridContainer = document.createElement("div");
    gridContainer.className = "grid grid-cols-[30px_1fr_1fr] gap-x-5";

    // Add header
    const headers = ["", "White", "Black"];
    headers.forEach(headerText => {
        const header = document.createElement("div");
        header.textContent = headerText;
        header.className = "font-bold text-center mt-2";
        gridContainer.appendChild(header);
    });

    history.forEach((move, index) => {
        if (index % 2 === 0) { // White's move
            const moveNumber = Math.floor(index / 2) + 1;

            // Move number cell
            const moveNumberDiv = document.createElement("div");
            moveNumberDiv.textContent = `${moveNumber}.`;
            moveNumberDiv.className = "text-center";
            gridContainer.appendChild(moveNumberDiv);

            // White's move cell
            const whiteMoveDiv = document.createElement("div");
            whiteMoveDiv.textContent = move;
            whiteMoveDiv.className = "text-center py-1 rounded-md";
            if (index === history.length - 1) { // Highlight last move
                whiteMoveDiv.classList.add("bg-zinc-700", "text-white");
            }
            gridContainer.appendChild(whiteMoveDiv);

            // Black's move cell
            const blackMoveDiv = document.createElement("div");
            if (history[index + 1]) {
                blackMoveDiv.textContent = history[index + 1];
                blackMoveDiv.className = "text-center py-1 rounded-md";
                if (index + 1 === history.length - 1) {
                    blackMoveDiv.classList.add("bg-zinc-700", "text-white");
                }
            } else {
                blackMoveDiv.textContent = "";
            }
            gridContainer.appendChild(blackMoveDiv);
        }
    });

    movesList.appendChild(gridContainer);
    movesList.scrollTop = movesList.scrollHeight;
};


socket.on("playerRole", (role) => {
    playerRole = role
    renderBoard()
    // updateTurnIndicator()
})

socket.on("spectatorRole", () => {
    playerRole = null
    document.getElementById("opponent-name").classList.add("hidden");
    document.getElementById("opponent").classList.add("hidden");
    document.getElementById("turn-indicator").classList.add("hidden");
    document.getElementById("turn").classList.add("hidden");
    document.getElementById("spectator-info").classList.remove("hidden");
    updateTurnIndicator()
    updateMovesList(data.history);
})

socket.on("boardState", (fen) => {
    chess.load(fen)
    renderBoard()
    const turn = chess.turn();
    const turnText = turn === 'w' ? 'White' : 'Black';
    document.getElementById("spectator-turn").textContent = turnText;
    updateTurnIndicator()
})

socket.on("moveMade", (data) => {
    chess.load(data.fen);
    renderBoard();
    updateMovesList(data.history);

    const isCheck = chess.in_check();
    const isMate = chess.in_checkmate();
    const isDraw = chess.in_draw() || chess.in_stalemate() || chess.insufficient_material();

    // CHECK
    if (isCheck) {
        Toastify({
            text: "Check!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#e31515ff",
            theme: "dark",
        }).showToast();
        check.play()
    }

    // CHECKMATE
    // if (isMate) {
    //     if (playerRole === chess.turn()) {
    //         Toastify({ text: "You lost by checkmate!", duration: 3000, gravity: "top", position: "right", backgroundColor: "#e91d19ff" }).showToast();
    //     } else if (playerRole && playerRole !== chess.turn()) {
    //         Toastify({ text: "You won by checkmate!", duration: 3000, gravity: "top", position: "right", backgroundColor: "#4CAF50" }).showToast();
    //     }
    //     document.getElementById('won').innerText = `${chess.turn() === 'w' ? 'Black' : 'White'} won!`;
    //     document.getElementById('won').classList.remove('hidden');
    //     // chess.reset();
    //     renderBoard();
    //     return;
    // }

    // // DRAW
    // if (isDraw) {
    //     Toastify({
    //         text: "Game Drawn!",
    //         duration: 3000,
    //         gravity: "top",
    //         position: "right",
    //         backgroundColor: "#4CAF50",
    //     }).showToast();
    //     // chess.reset();
    //     renderBoard();
    //     return;
    // }


    //NEW logic
    if (isMate || isDraw) {
        let message = "";
        let title = "";
        let icon = "";
        let titleColor = "";

        if (isMate) {
            // Determine who won based on the current turn (the loser's turn)
            const isWinner = (playerRole !== chess.turn());


            title = isWinner ? "You Won!" : "You Lost";
            titleColor = isWinner ? "text-green-500" : "text-red-500";
            message = isWinner ? "Congratulations, you have defeated your opponent!" : "Your opponent has delivered checkmate.";
            icon = isWinner ? "👑" : "💀"; // Crown for win, skull for loss
            gameEnd.play()

        } else if (isDraw) {
            title = "Game Drawn!";
            titleColor = "text-yellow-500";
            message = "The game ended in a draw.";
            icon = "🤝"; // Handshake icon for a draw
             gameEnd.play()
        }

        // 🎨 Update and show the modal
        if (playerRole) { // Only show for the players, not spectators
            modalTitle.textContent = title;
            modalTitle.className = `text-4xl font-extrabold ${titleColor} animate-pulse mb-2`;
            modalMessage.textContent = message;
            modalIcon.textContent = icon;

            gameOverModal.classList.remove('hidden');

            // Add a small delay to trigger the transition effect
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
    illegal.play()
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
     gameStart.play()
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

//INFO: play again button logic
document.getElementById("playAgainBtn").addEventListener("click", function (event) {
    event.preventDefault(); // Stop the default link behavior

    // Redirect with query parameters
    window.location.href = `/first?username=${encodeURIComponent(username)}`;
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

closeModalBtn.addEventListener('click', () => {
    gameOverModal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        gameOverModal.classList.add('hidden');
    }, 300); // Wait for the transition to finish
});

renderBoard()