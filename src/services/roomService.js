import { prisma } from './prismaClient.js';
import fetchLeetCodeSolved from "../services/leetcodeStatsService.js";

export async function createRoom(data) {
    if (!data) throw new Error("data missing");

    const createPayload = {
        data: {
            room_code: Number(data.room_code),
            name: data.name,
            description: data.description ?? null,
            img_url: data.image_url ?? null,
            cost: data.cost ?? 0,
            end_date: new Date(data.end_date),
            status: "ONGOING"
        }
    };

    try {
        return await prisma.Rooms.create(createPayload);
    } catch (err) {
        if (err.code === 'P2002') {
            const target = err.meta?.target?.join(',') || 'unique field';
            throw new Error(`Unique constraint failed on: ${target}`);
        }
        throw err;
    }
}

export async function listRooms() {
    return await prisma.Rooms.findMany();
}

export async function fetchRoomById(roomId) {
    const room = await prisma.Rooms.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");
    return room;
}

export async function joinRoom(roomId, userId) {
    // Check room
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });
    if (!room) throw new Error("Room does not exist");

    // Check user
    const user = await prisma.User.findUnique({
        where: { id: userId }
    });
    if (!user) throw new Error("User does not exist");

    // Prevent duplicates
    const exists = await prisma.RoomUser.findUnique({
        where: { room_id_user_id: { room_id: roomId, user_id: userId } }
    });
    if (exists) throw new Error("Already joined");

    // Fetch initial count from LC API
    const initialCount = await fetchLeetCodeSolved(user.leetcode);

    return await prisma.RoomUser.create({
        data: {
            room_id: roomId,
            user_id: userId,
            initial_qn_count: initialCount,
            final_qn_count: null
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
        .map(r => {
            const final = r.final_qn_count ?? r.initial_qn_count;
            return {
                user: r.user,
                initial: r.initial_qn_count,
                final,
                score: final - r.initial_qn_count
            };
        })
        .sort((a, b) => b.score - a.score);
}

export async function getRoomDetails(roomId, userId) {
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId },
    });

    if (!room) throw new Error("Room not found");

    const participants = await prisma.RoomUser.count({
        where: { room_id: roomId }
    });

    const leaderboard = await getLeaderboard(roomId);

    let joined = false;
    if (userId) {
        const exists = await prisma.RoomUser.findUnique({
            where: {
                room_id_user_id: { room_id: roomId, user_id: userId }
            }
        });
        joined = !!exists;
    }

    return {
        room: {
            ...room,
            participants_count: participants,
        },
        leaderboard,
        joined
    };
}
