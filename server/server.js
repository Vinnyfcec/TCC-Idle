const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/')));

app.get('/heart', (req, res) => {
    res.json({status: 'ok', timeStamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.listen(PORT, () => {
    console.log(`Server in localhost:${PORT}`);
});