const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 AdsEngineer landing page running at http://${HOST}:${PORT}`);
    console.log(`   Access externally via your VPS IP on port ${PORT}`);
});
