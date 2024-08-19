const mongoose = require('mongoose');

// Define the schema for a transaction
const transactionSchema = new mongoose.Schema({
    sourcePublicKey: { type: String, required: true },
    destinationPublicKey: { type: String, required: true },
    amount: { type: String, required: true },
    transactionId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

// Compile the schema into a model and export it
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
