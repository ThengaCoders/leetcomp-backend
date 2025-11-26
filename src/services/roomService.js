import { prisma } from './prismaClient.js';

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

export async function createRoom(data) {
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

    try {
        const room = await prisma.Rooms.create(createPayload);
        return room;
    } catch (err) {
        if (err.code === 'P2002') {
            const target = err.meta && err.meta.target ? err.meta.target.join(',') : 'unique field';
            throw new Error(`Unique constraint failed on: ${target}`);
        }
        throw err;
    }
}

export async function listRooms() {
    return await prisma.Rooms.findMany();
}

export async function fetchRoomById(roomId) {
    try {
        const room = await prisma.rooms.findUnique({
            where: { id: roomId },
        });
        return room;
    } catch (error) {
        console.error("Error fetching room by ID:", error);
        throw error;
    }
}

export async function joinRoom(roomId, userId) {
    // Check room exists
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });
    if (!room) throw new Error("Room does not exist");

    // Check user exists
    const user = await prisma.User.findUnique({
        where: { id: userId }
    });
    if (!user) throw new Error("User does not exist");

    // Check duplicate
    const exists = await prisma.RoomUser.findUnique({
        where: {
            room_id_user_id: { room_id: roomId, user_id: userId }
        }
    });
    if (exists) throw new Error("Already joined");

    // Create record with placeholder solved counts
    return await prisma.RoomUser.create({
        data: {
            room_id: roomId,
            user_id: userId,
            initial_qn_count: 0,
            final_qn_count: 0
        }
    });
}


export async function getLeaderboard(roomId) {
    const rows = await prisma.RoomUser.findMany({
        where: { room_id: roomId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    picture: true
                }
            }
        }
    });

    return rows
        .map(r => ({
            user: r.user,
            initial: r.initial_qn_count,
            final: r.final_qn_count ?? r.initial_qn_count,
            score: (r.final_qn_count ?? r.initial_qn_count) - r.initial_qn_count
        }))
        .sort((a, b) => b.score - a.score);
}

