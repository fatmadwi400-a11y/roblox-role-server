cat > server.js << 'SELESAI'
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Terhubung ke MongoDB!'))
    .catch((err) => console.log('Gagal koneksi:', err));

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    role: { type: String, default: 'Member' },
    updatedAt: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

function checkSecret(req, res) {
    if (req.headers['x-api-key'] !== process.env.SECRET_KEY) {
        res.status(403).json({ error: "Akses ditolak! Secret key salah." });
        return false;
    }
    return true;
}

app.get('/', (req, res) => {
    res.json({ status: "Server berjalan normal" });
});

app.post('/setrole', async (req, res) => {
    if (!checkSecret(req, res)) return;
    const { userId, role } = req.body;
    if (!userId || !role) {
        return res.status(400).json({ error: "userId dan role wajib diisi!" });
    }
    try {
        await Player.findOneAndUpdate(
            { userId: userId },
            { role: role, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "Role berhasil diset ke " + role });
    } catch (error) {
        res.status(500).json({ error: "Terjadi error: " + error.message });
    }
});

app.get('/getrole', async (req, res) => {
    if (!checkSecret(req, res)) return;
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "userId wajib diisi!" });
    }
    try {
        const player = await Player.findOne({ userId: userId });
        if (!player) {
            return res.json({ userId: userId, role: "Member" });
        }
        res.json({ userId: userId, role: player.role });
    } catch (error) {
        res.status(500).json({ error: "Terjadi error: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server jalan di port " + PORT);
});
SELESAI