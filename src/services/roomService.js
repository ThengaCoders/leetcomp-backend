// src/services/roomService.js
// Prisma-compatible dummy service (in-memory) with validations

let rooms = [
    {
        id: 1,
        host_id: 1,
        name: "Test Room A",
        password: null,
        entry_cost: 100,
        start_time: new Date(),
        end_time: new Date(),
        image_url: null,
        prizepool: 0,
        created_at: new Date(),
        updated_at: new Date()
    }
];

let participants = [];

async function createRoom(data) {
    if (!data || !data.host_id || !data.name) {
        throw new Error("host_id and name are required");
    }

    const newRoom = {
        id: rooms.length + 1,
        host_id: Number(data.host_id),
        name: data.name,
        password: data.password ?? null,
        entry_cost: data.entry_cost ?? 0,
        start_time: data.start_time ? new Date(data.start_time) : new Date(),
        end_time: data.end_time ? new Date(data.end_time) : new Date(),
        image_url: data.image_url ?? null,
        prizepool: 0,
        created_at: new Date(),
        updated_at: new Date()
    };

    rooms.push(newRoom);
    return newRoom;
}

async function listRooms() {
    return rooms;
}

async function fetchRoomById(roomId) {
    const room = rooms.find(r => r.id === Number(roomId));
    if (!room) throw new Error("Room not found");
    return room;
}

async function joinRoom(roomId, userId) {
    // 1) Ensure room exists
    const room = rooms.find(r => r.id === Number(roomId));
    if (!room) {
        throw new Error("Room does not exist");
    }

    // 2) Prevent duplicate join (use the same keys we store)
    const exists = participants.find(
        p => p.room_id === Number(roomId) && p.user_id === Number(userId)
    );

    if (exists) {
        throw new Error("User already joined");
    }

    // 3) Create participant and (optionally) update prizepool
    const p = {
        id: participants.length + 1,
        room_id: Number(roomId),
        user_id: Number(userId),
        joined_at: new Date(),
        paid: true,
        problems_solved: 0,
        last_solve_time: null
    };

    participants.push(p);

    // Optional: update prizepool in dummy (mirror real behavior)
    // room.prizepool += room.entry_cost;

    return p;
}

module.exports = {
    createRoom,
    listRooms,
    fetchRoomById,
    joinRoom
};
