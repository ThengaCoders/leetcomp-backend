const router = require("express").Router();
const roomController = require("../controllers/roomController")

router.post("/", roomController.createRoom);

router.get("/", roomController.listRooms);

router.get("/:roomId", roomController.fetchRoomById);

router.post("/:roomId/join", roomController.joinRoom);

module.exports = router;