import * as roomService from '../services/roomService.js';
export const createRoom= async (req, res)=> {

    try {
        const result = await roomService.createRoom(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const listRooms= async(req, res)=>{
    try {
        const rooms = await roomService.listRooms();
        res.json(rooms);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const fetchRoomById=async(req, res)=>{
    try {
        const result = await roomService.fetchRoomById(req.params.roomId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const joinRoom=async (req, res)=>{
    try {
        const result = await roomService.joinRoom(req.params.roomId,req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
