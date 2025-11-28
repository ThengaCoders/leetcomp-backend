import prisma from "../prisma.js";

export default async function finalizeRoom(roomId) {
    const room = await prisma.Rooms.findUnique({
        where: { id: roomId }
    });

    if (!room) throw new Error("Room not found");

    if (room.status === "FINISHED") {
        return { alreadyFinalized: true };
    }

    await prisma.Rooms.update({
        where: { id: roomId },
        data: { status: "FINISHED" }
    });

    return { success: true };
}
