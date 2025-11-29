import express from "express";
const router = express.Router();
import * as roomController from '../controllers/roomController.js';
import auth from "../middleware/auth.js";


router.post("/", roomController.createRoom);

router.get("/", roomController.listRooms);

router.get("/:roomId/leaderboard", roomController.fetchLeaderboard);

router.post("/:roomId/join", auth, roomController.joinRoom);

router.get("/:roomId/details", auth, roomController.fetchRoomDetails);

router.get("/:roomId", roomController.fetchRoomById);

export default router;