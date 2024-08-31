import { Vars } from "../Vars";
import { v4 as uuidv4 } from "uuid";
import { Game } from "./GameService";
import { DatabaseService } from "./DatabaseService";
import { Room, RoomService } from "./RoomService";
import { Socket } from "socket.io";

interface CustomSocket extends Socket {
    userId?: number; //
}

export namespace SocketService {
    export async function initialize() {
        listen();
    }
    function listen() {
        Vars.io.on("connection", (socket: CustomSocket) => {
            socket.on("disconnect", async (reason) => {
                console.log("socket disconnected : ", reason);

                if (!socket.userId) return;

                if (socket.rooms.has("lobby")) {
                    Vars.io.emit("LEAVELOBBY", socket.userId);
                }

                const room = RoomService.getRoomFromUserId(socket.userId);
                if (room) {
                    await RoomService.deleteRoom(room.roomId);
                    socket.broadcast.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                    socket.broadcast.to(room.roomId.toString()).emit("DELETEROOM", {});
                }
            });

            socket.on("LOGIN", async ({ userName, phoneNumber }: LoginPacket, callback) => {
                const result = await DatabaseService.findUser({ userName, phoneNumber });
                if (result.success) {
                    RoomService.addUser(result.user!);
                    socket.userId = result.user?.userId;
                    await socket.join("lobby");
                    Vars.io.to("lobby").emit("JOINLOBBY", result.user);
                }
                callback(result);
            });

            socket.on("REGISTER", async ({ userName, phoneNumber }: LoginPacket, callback) => {
                const result = await DatabaseService.createUser({ userName, phoneNumber });
                if (result.success) {
                    RoomService.users.push({
                        userId: result.userId,
                        userName,
                        phoneNumber,
                        score: 0,
                    });
                }
                callback(result);
            });

            socket.on("DELETEROOM", async ({ roomId }: DeleteRoomPacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!socket.userId) return;
                const user = room?.getUser(socket.userId);
                if (!user || user.power !== "leader") {
                    callback({ success: false });
                    return;
                }
                await RoomService.deleteRoom(roomId);
                socket.broadcast.to("lobby").emit("DELETEROOM", { roomId });
                socket.broadcast.to(roomId.toString()).emit("DELETEROOM", {});
                callback({ success: true });
            });

            socket.on("KICKMEMBER", async ({ roomId, userId, targetId }, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) {
                    callback({ success: false });
                    return;
                }
                const user = room.getUser(userId);
                if (!user || user.power !== "leader") {
                    callback({ success: false });
                    return;
                }
                room.kickMember(targetId);
                callback({ success: true });
            });

            socket.on("GETROOMS", async ({}: GetRoomsPacket, callback) => {
                if (!socket.userId) return;
                const rooms = RoomService.getRooms();
                callback({
                    success: true,
                    rooms: rooms.map((room) => ({
                        roomId: room.roomId,
                        roomName: room.roomName,
                        users: room.getUsers(),
                        started: room.getGame().isStarted,
                    })),
                });
            });

            socket.on("STARTGAME", async ({ roomId }: StartGamePacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) return;
                const user = room.getUser(socket.userId);
                if (!user || user.power !== "leader") return;
                await room.getGame().startGame();
                callback({ success: true });
            });

            socket.on("JOINROOM", async ({ roomId }: JoinRoomPacket, callback) => {
                const user = RoomService.getUser(socket.userId);
                if (!user) {
                    callback({ success: false });
                    return;
                }
                const room = RoomService.getRoom(roomId);
                if (!room) {
                    callback({ success: false });
                    return;
                }
                const success = RoomService.joinRoom(user.userId, roomId);
                if (!success) {
                    callback({ success: false });
                    return;
                }
                const users = room.getUsers();
                callback({ success: true, users: users });
                socket.broadcast.to(roomId.toString()).emit("JOINUSER", user);
                socket.leave("lobby");
                socket.join(roomId.toString());
                socket.broadcast.to("lobby").emit("JOINUSER", { user, roomId });
            });

            socket.on("CREATEROOM", async ({ roomName }: CreateRoomPacket, callback) => {
                const user = RoomService.getUser(socket.userId);
                if (!user) {
                    callback({ success: false });
                    return;
                }
                const roomId = uuidv4();
                const game = new Game(roomId);
                game.addUser(user);

                const room = new Room(game, roomId, roomName);
                RoomService.addRoom(room);
                room.addUser(user, "leader");

                socket.leave("lobby");
                callback({ room });

                Vars.io.to("lobby").emit("CREATEROOM", {
                    roomId: room.roomId,
                    roomName: room.roomName,
                    users: room.getUsers(),
                    started: room.getGame().isStarted,
                });
            });

            socket.on("CHAT", ({ roomId, message }: ChatPacket, callback) => {
                const user = RoomService.getUser(socket.userId);
                const room = RoomService.getRoom(roomId);
                if (!room) {
                    callback({
                        success: false,
                    });
                    return;
                }
                if (!user) {
                    callback({ success: false });
                    return;
                }
                socket.broadcast.to(roomId).emit("CHAT", { userName: user.userName, message });
            });

            socket.on("WORD", ({ roomId, word }: WordPacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) return;
                const user = room.getUser(socket.userId);
                if (!user) return;
                const success = room.getGame().word(socket.userId!, word);
                socket.broadcast.to(room.roomId).emit("WORD", { userId: socket.userId!, success, word });
            });
        });
    }
}
