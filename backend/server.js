const express = require('express');
const app = express();
const PORT = 3000;


const path = require('path')

app.use(express.static(path.join(__dirname, '../frontend')))

// A simple route for the home page
app.get('/', (req, res) => {
    res.send('Server is running on localhost:3000!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on http://localhost:${PORT}`);
});