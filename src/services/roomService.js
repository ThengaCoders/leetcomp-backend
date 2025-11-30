import { prisma } from './prismaClient.js';
import fetchLeetCodeSolved from "./leetcodeStatsService.js";

export async function createRoom(data, userId) {
    if (!data) throw new Error("Data is missing");

    if (!data.name || typeof data.name !== "string") {
        throw new Error("Room name is required");
    }

    if (!data.room_code || isNaN(Number(data.room_code))) {
        throw new Error("Room code must be a valid number");
    }
    const room_code = Number(data.room_code);
    if (room_code <= 0) {
        throw new Error("Room code must be a positive integer");
    }

    if (data.cost == null || isNaN(Number(data.cost))) {
        throw new Error("Room cost must be a valid number");
    }
    const cost = Number(data.cost);
    if (cost < 0) {
        throw new Error("Room cost cannot be negative");
    }

    if (!data.end_date) {
        throw new Error("End date is required");
    }

    const parsedDate = new Date(data.end_date);

    if (isNaN(parsedDate.getTime())) {
        throw new Error("End date is invalid. Expected format: YYYY-MM-DD");
    }

    // Force time to midnight of that date
    parsedDate.setHours(23, 59, 59, 999);

    const now = new Date();
    if (parsedDate <= now) {
        throw new Error("End date must be a future date");
    }

    const createPayload = {
        data: {
            created_by: userId,
            room_code: room_code,
            roomName: data.name,
            description: data.description ?? null,
            img_url: data.image_url ?? null,
            cost: cost,
            end_date: parsedDate,
            status: "ONGOING",
            participant_count: 0,
            prizePool: 0
        }
    };

    try {
        return await prisma.Rooms.create(createPayload);

    } catch (err) {
        // Unique constraint handler
        if (err.code === "P2002") {
            const target = err.meta?.target?.join(", ") || "unique field";
            throw new Error(`Unique constraint failed: ${target}`);
        }

        console.error("Error creating room:", err);
        throw new Error("Server error while creating room");
    }
}

export async function listRooms(userId) {
  return await prisma.rooms.findMany({
    where: {
      participants: {
        some: {
          user_id: userId,
        },
      },
    },
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
                    leetcode: true
                }
            }
        }
    });

    const formattedMembers = members.map(m => ({
        userId: m.user.id,
        username: m.user.username,
        leetcode: m.user.leetcode,
        initial_qn_count: m.initial_qn_count
    }));

    return {
        room,
        members: formattedMembers
    };
}

export async function joinRoom(roomId, userId, leetcodeId) {

    return await prisma.$transaction(async (tx) => {
        const room = await tx.rooms.findUnique({
            where: { id: roomId }
        });
        if (!room) throw new Error("Room does not exist");

        if (room.cost !== 0)
            throw new Error("I like your smartness. But don't try to be oversmart.");

        const user = await tx.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new Error("User does not exist");

        const exists = await tx.roomUser.findUnique({
            where: {
                room_id_user_id: {
                    room_id: roomId,
                    user_id: userId
                }
            }
        });
        if (exists) throw new Error("Already joined");

        const initial_qn_count = await fetchLeetCodeSolved(leetcodeId);

        // Add user to room
        const joinRecord = await tx.roomUser.create({
            data: {
                room_id: roomId,
                user_id: userId,
                initial_qn_count,
                final_qn_count: 0
            }
        });

        await tx.rooms.update({
            where: { id: roomId },
            data: {
                participant_count: { increment: 1 },
                prizePool: { increment: room.cost }
            }
        });

        return joinRecord;
    });
}