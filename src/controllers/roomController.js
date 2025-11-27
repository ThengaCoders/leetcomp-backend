import * as roomService from '../services/roomService.js';
export const createRoom = async (req, res) => {

    try {
        const result = await roomService.createRoom(req.body, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const listRooms = async (req, res) => {
    try {
        const rooms = await roomService.listRooms(req.user.id);
        res.json(rooms);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const fetchRoomById = async (req, res) => {
    try {
        const result = await roomService.fetchRoomById(req.params.roomId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const fetchLeaderboard = async (req, res) => {
    try {
        const data = await roomService.getLeaderboard(req.params.roomId);
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const joinRoom = async (req, res) => {
    try {
        const result = await roomService.joinRoom(req.params.roomId, req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
