import { prisma } from './prismaClient.js';
import { getLeetCodeTotalSolved } from '../utils/getLeetCodeTotalSolved.js';

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

export async function createRoom(data, userId) {
    if (!data) {
        throw new Error("data missing");
    }

    const createPayload = {
        data: {
            created_by: userId,
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

export async function listRooms(userId) {
    return await prisma.Rooms.findMany({
      where: { created_by: userId },
    });
}

export async function fetchRoomByCode(roomCode, userId) {
    const room = await prisma.Rooms.findUnique({
        where: {
            room_code: parseInt(roomCode)
        }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const member = await prisma.RoomUser.findUnique({
        where: {
            room_id_user_id: {
                room_id: room.id,
                user_id: userId
            }
        }
    });

    const isMember = !!member;

    return {
        ...room,
        isMember
    };

}

export async function fetchRoomById(roomId, userId) {
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const membership = await prisma.RoomUser.findUnique({
        where: {
            room_id_user_id: {
                room_id: roomId,
                user_id: userId
            }
        }
    });

    if (!membership) {
        const err = new Error("Forbidden: You are not a member of this room");
        err.statusCode = 403;
        throw err;
    }

    const members = await prisma.RoomUser.findMany({
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

    const formattedMembers = members.map(m => ({
        userId: m.user.id,
        username: m.user.username,
        picture: m.user.picture,
        initial_qn_count: m.initial_qn_count
    }));

    return {
        room,
        members: formattedMembers
    };
}

export async function joinRoom(roomId, userId, leetcodeId) {
    // Check room exists
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });
    if (!room) throw new Error("Room does not exist");
    
    if (room.cost != 0) throw new Error("I like your smartness. But don't try to be oversmart.");

    // Check user exists
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) throw new Error("User does not exist");

    // Check duplicate
    const exists = await prisma.roomUser.findUnique({
        where: {
            room_id_user_id: { room_id: roomId, user_id: userId }
        }
    });
    if (exists) throw new Error("Already joined");
    
    const initial_qn_count = await getLeetCodeTotalSolved(leetcodeId);

    // Create record with placeholder solved counts
    return await prisma.RoomUser.create({
        data: {
            room_id: roomId,
            user_id: userId,
            initial_qn_count,
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


export async function submitFinal(roomId, userId, finalCount) {
    // Validate number
    if (!Number.isInteger(finalCount)) {
        throw new Error("final_qn_count must be an integer");
    }

    // Fetch room
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });
    if (!room) throw new Error("Room not found");

    const now = new Date();
    if (now < room.end_date) {
        throw new Error("Room has not ended yet");
    }

    // Fetch participant entry
    const participant = await prisma.RoomUser.findUnique({
        where: {
            room_id_user_id: {
                room_id: roomId,
                user_id: userId
            }
        }
    });

    if (!participant) {
        throw new Error("You are not a participant of this room");
    }

    if (participant.final_qn_count !== null) {
        throw new Error("Final count already submitted");
    }

    // Validate logical boundaries
    if (finalCount < participant.initial_qn_count) {
        throw new Error("Final count cannot be less than initial count");
    }

    const MAX_DELTA = 500; // prevent cheating
    if (finalCount > participant.initial_qn_count + MAX_DELTA) {
        throw new Error("Unrealistic final count submitted");
    }

    // Save the final count
    await prisma.RoomUser.update({
        where: { id: participant.id },
        data: {
            final_qn_count: finalCount
        }
    });

    return { success: true, message: "Final count submitted successfully" };
}



