const socket = io()
const chess = new Chess()
const boardElement = document.querySelector(".chessboard")



let draggerPiece = null
let sourceSquare = null
let playerRole = null

const username = new URLSearchParams(window.location.search).get("username") || "Guest";
const roomId = new URLSearchParams(window.location.search).get("room") || "default-room";

socket.emit("joinRoom", { username, roomId });


const renderBoard = () => {
    const board = chess.board()
    boardElement.innerHTML = ""

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div")
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            )

            squareElement.dataset.row = rowindex
            squareElement.dataset.col = squareindex

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
                        sourceSquare = { row: rowindex, col: squareindex }
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
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),

                    }

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
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }
    // Validate turn before emitting
    const turn = chess.turn(); // 'w' or 'b'
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

    socket.emit("move", move)

}


const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔",  // King
        Q: "♕",  // Queen
        R: "♖",  // Rook
        B: "♗",  // Bishop
        N: "♘",  // Knight
        P: "♙",  // Pawn
        k: "♚",  // King
        q: "♛",  // Queen
        r: "♜",  // Rook
        b: "♝",  // Bishop
        n: "♞",  // Knight
        p: '♙'  // Pawn
    }
    return unicodePieces[piece.type] || ""
}

socket.on("playerRole", (role) => {
    playerRole = role
    renderBoard(``)
    updateTurnIndicator()
})

socket.on("spectatorRole", () => {
    playerRole = null
    renderBoard()
})

socket.on("boardState", (fen) => {
    chess.load(fen)
    renderBoard(fen)
    const turn = chess.turn(); // 'w' or 'b'
    const turnText = turn === 'w' ? 'White' : 'Black';
    document.getElementById("spectator-turn").textContent = turnText;
    updateTurnIndicator()
})

// socket.on("move", (move) => {
//     const turn = chess.turn();          // 'w' or 'b'
//     const amI = playerRole;



//     chess.move(move)
//     updateTurnIndicator()
//     renderBoard()

//     // 3) game-state checks
//     // 'w', 'b', or null (spectator)
//     const isCheck = chess.in_check();
//     const isMate = chess.in_checkmate();
//     const isDraw = chess.in_draw()
//         || chess.in_stalemate()
//         || chess.insufficient_material();



//     // CHECK
//     if (isCheck && amI !== turn) {
//         Toastify({
//             text: "Check!",
//             duration: 3000,
//             gravity: "top",
//             position: "right",
//             backgroundColor: "#e31515ff",
//             theme: "dark",
//         }).showToast();
//     }

//     // CHECKMATE
//     if (isMate) {
//         if (amI !== turn) {
//             Toastify({
//                 text: "You lost by checkmate!",
//                 duration: 3000,
//                 gravity: "top",
//                 position: "right",
//                 backgroundColor: "#4CAF50",
//             }).showToast();
//         } else if (amI && amI === turn) {
//             Toastify({
//                 text: "You won by checkmate!",
//                 duration: 3000,
//                 gravity: "top",
//                 position: "right",
//                 backgroundColor: "#4CAF50",
//             }).showToast();
//         }
//         if(turn==='w') document.getElementById('won').innerText=`${players.white} won`
//         else if(turn==='b') document.getElementById('won').innerText=`${players.black} won`
        
//         document.getElementById('won').classList.remove('hidden')
//         chess.reset();
//         renderBoard();
//         return;
//     }

//     // DRAW / STALEMATE / INSUFFICIENT MATERIAL
//     if (isDraw) {
//         Toastify({
//             text: "Game Drawn!",
//             duration: 3000,
//             gravity: "top",
//             position: "right",
//             backgroundColor: "#4CAF50",
//         }).showToast();
//         chess.reset();
//         renderBoard();
//         return;
//     }
// })


// Show welcome toast when connected
socket.on("connect", () => {
    Toastify({
        text: "Welcome to the Chess Game!",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#4CAF50",
    }).showToast();
});

socket.on("moveMade", (data) => {
    const previousFen = chess.fen();
    chess.load(data.fen);

    const isCheck = chess.in_check();
    const isMate = chess.in_checkmate();
    const isDraw = chess.in_draw() || chess.in_stalemate() || chess.insufficient_material();

    // The order of sound checks is important
    if (isMate) {
        playSound(gameEnd);
    } else if (isCheck) {
        playSound(check);
    } else {
        // Play opponent's move sound only if the last move wasn't a check or mate
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

        if (isMate) {
            // Correct logic: The winner's role is NOT the current turn's role
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

// Show player role toast
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

// Show spectator toast
socket.on("spectatorRole", () => {
    Toastify({
        text: "You are watching as a Spectator",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#9E9E9E",
    }).showToast();
    document.getElementById("opponent-name").classList.add("hidden");
    document.getElementById("opponent").classList.add("hidden");
    document.getElementById("turn-indicator").classList.add("hidden");
    document.getElementById("turn").classList.add("hidden");
    document.getElementById("spectator-info").classList.remove("hidden");
    updateTurnIndicator()
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

// const username = new URLSearchParams(window.location.search).get("username") || "Guest";
socket.emit("joinGame", { username });

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



const updateTurnIndicator = () => {
    const turn = chess.turn(); // 'w' or 'b'
    const indicator = document.getElementById("turn-indicator");

    // if (!playerRole) {
    //     indicator.innerText = "Spectating";
    //     return;
    // }

    if (turn == 'w') {
        indicator.innerText = "White's turn";
        indicator.classList.remove("text-red-500");
        indicator.classList.add("text-green-500");
    } else {
        indicator.innerText = "Black's turn";
        indicator.classList.remove("text-green-500");
        indicator.classList.add("text-yellow-500");
    }
};







renderBoard()