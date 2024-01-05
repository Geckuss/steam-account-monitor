const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

const apiKey = '***REMOVED***'; // Replace with your actual API key

app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to backside of Steam Profile Monitor!');
});

app.get('/profile/:steamId', async (req, res) => {
    const steamId = req.params.steamId;
    try {
        const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`);
        const profileData = response.data.response.players[0];
        res.json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
