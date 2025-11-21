const roomService = require("../services/roomService")
async function createRoom(req, res) {

    try {
        const result = await roomService.createRoom(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function listRooms(req, res) {
    try {
        const rooms = await roomService.listRooms();
        res.json(rooms);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function fetchRoomById(req, res) {
    try {
        const result = await roomService.fetchRoomById(req.params.roomId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function joinRoom(req, res) {
    try {
        const result = await roomService.joinRoom(req.params.roomId,req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { createRoom, joinRoom, fetchRoomById, listRooms };