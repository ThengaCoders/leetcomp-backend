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

export const fetchRoomByCode = async (req, res) => {
    try {
        const result = await roomService.fetchRoomByCode(req.query.code, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const fetchRoomById = async (req, res) => {
    try {
        const result = await roomService.fetchRoomById(req.params.roomId, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
}

export const joinRoom = async (req, res) => {
    try {
        const result = await roomService.joinRoom(req.params.roomId, req.user.id, req.user.leetcode);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const submitFinal = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user.id;
        const { final_qn_count } = req.body;

        const result = await roomService.submitFinal(roomId, userId, final_qn_count);

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

