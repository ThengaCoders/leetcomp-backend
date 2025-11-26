import express from "express";
const router = express.Router();
import * as roomController from '../controllers/roomController.js';

router.post("/", roomController.createRoom);

router.get("/", roomController.listRooms);

router.get("/:roomId/leaderboard", roomController.fetchLeaderboard);

router.get("/:roomId", roomController.fetchRoomById);

router.post("/:roomId/join", roomController.joinRoom);

export default router;