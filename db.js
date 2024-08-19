const mongoose = require('mongoose');

// Connection string for MongoDB
mongoose.connect('mongodb://localhost:27017/decentralized-wallet');
 // Adjust the database name as needed

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Connection events
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
