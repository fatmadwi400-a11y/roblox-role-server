const express = require('express');
const app = express();
app.use(express.json());

// Database sementara
const playerRoles = {};

// SECRET KEY (harus sama dengan Roblox)
const SECRET_KEY = "kunci_rahasia_123";

function checkSecret(req, res) {
    if (req.headers['x-api-key'] !== SECRET_KEY) {
        res.status(403).json({ error: "Akses ditolak" });
        return false;
    }
    return true;
}

app.post('/setrole', (req, res) => {
    if (!checkSecret(req, res)) return;

    const { userId, role } = req.body;
    playerRoles[userId] = role;
    res.json({ success: true, userId, role });
});

app.get('/getrole', (req, res) => {
    if (!checkSecret(req, res)) return;

    const { userId } = req.query;
    const role = playerRoles[userId] || "Member";
    res.json({ userId, role });
});

app.listen(3000, () => {
    console.log('Server jalan di port 3000');
});