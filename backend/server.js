const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('./config.json');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Start server
const PORT = config.server_port || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});