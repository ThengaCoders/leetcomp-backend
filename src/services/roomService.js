const prisma = require('./prismaClient');

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
    if (!data) {
        throw new Error("data missing");
    }

    const createPayload = {
        data: {
            room_code: Number(data.room_code),
            name: data.name,
            description: data.description ?? null,
            img_url: data.image_url ?? null,
            cost: data.cost ?? 0,
            end_date: new Date(data.end_date)
        }
    };

    try{
        const room = await prisma.Rooms.create(createPayload);
        return room;
    } catch (err){
        if (err.code === 'P2002') {
            const target = err.meta && err.meta.target ? err.meta.target.join(',') : 'unique field';
            throw new Error(`Unique constraint failed on: ${target}`);
        }
        throw err;
    }
}

async function listRooms() {
    return await prisma.Rooms.findMany();
}

async function fetchRoomById(roomId) {
    try {
        const room = await prisma.rooms.findUnique({
            where: { id: Number(roomId) },
        });
        return room;
    } catch (error) {
        console.error("Error fetching room by ID:", error);
        throw error;
    }
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
