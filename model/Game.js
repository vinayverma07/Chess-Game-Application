// models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    player1Name: {
        type: String,
        required: true
    },
    player2Name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true // the user who initiated the save
    },
    result: { // 'win', 'loss', 'draw'
        type: String,
        enum: ['win', 'loss', 'draw'],
        required: true
    },
    winnerName: { // The username of the winner, or null for a draw
        type: String,
        default: null
    },
    moves: { // An array of move strings (e.g., ['e4', 'e5', 'Nf3', ...])
        type: [String],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Game', gameSchema);