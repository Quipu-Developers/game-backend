import { Vars } from "../Vars";
import { v4 as uuidv4 } from "uuid";
import { Game } from "./GameService";
import { DatabaseService } from "./DatabaseService";
import { Room, RoomService } from "./RoomService";
export namespace SocketService {
    export async function initialize() {
        listen();
    }
    function listen() {
        Vars.io.on("connection", (socket) => {
            socket.on("LOGIN", async ({ userName, phoneNumber }: LoginPacket, callback) => {
                const { userId } = await DatabaseService.createUser({ userName, phoneNumber });
                console.log(userId);
                RoomService.users.push({
                    userId,
                    userName,
                    phoneNumber,
                    score: 0,
                    teamId: 0,
                    teamName: "",
                });
                callback({ userId: userId });
            });
            socket.on("DELETEROOM", async ({ roomId, userId }: DeleteRoomPacket, callback) => {
                const room = RoomService.getRoom(roomId);
                const user = room?.getUser(userId);
                if (!user || user.power !== "leader") {
                    callback({ success: false });
                    return;
                }
                await RoomService.deleteRoom(roomId);
                socket.broadcast.to(roomId.toString()).emit("DELETEROOM", {});
                callback({ success: true });
            });
            /**                          방아이디, 강퇴하는 유저아이디, 강퇴당하는 유저아이디 */
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
            socket.on("GETROOMS", async ({ userId }: GetRoomsPacket, callback) => {
                const user = RoomService.getUser(userId);
                if (!user) {
                    callback({
                        success: false,
                    });
                    return;
                }
                const rooms = RoomService.getRooms();
                console.log(rooms);
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
            socket.on("STARTGAME", async ({ userId, roomId }: StartGamePacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) return;
                const user = room.getUser(userId);
                if (!user || user.power !== "leader") return;
                await room.getGame().startGame();
                callback({ success: true });
            });
            socket.on("JOINROOM", async ({ userId, roomId }: JoinRoomPacket, callback) => {
                const user = RoomService.getUser(userId);
                if (!user) {
                    callback({ success: false });
                    return;
                }
                const room = RoomService.getRoom(roomId);
                if (!room) {
                    callback({ success: false });
                    return;
                }
                const success = RoomService.joinRoom(user, roomId);
                if (!success) {
                    callback({ success: false });
                    return;
                }
                const users = room.getUsers();
                callback({ success: true, users: users });
                socket.broadcast.to(roomId.toString()).emit("JOINUSER", user);
                socket.join(roomId.toString());
            });
            socket.on("CREATEROOM", async ({ userId, roomName }: CreateRoomPacket, callback) => {
                const user = RoomService.getUser(userId);
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
                callback({ room: room });
            });
            socket.on("CHAT", ({ userInfo, roomId, message }: ChatPacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) {
                    callback({
                        success: false,
                    });
                    return;
                }
                socket.broadcast.to(roomId).emit("CHAT", { userId: userInfo.userId, message });
            });
            socket.on("WORD", ({ userId, roomId, word }: WordPacket, callback) => {
                const room = RoomService.getRoom(roomId);
                if (!room) return;
                const user = room.getUser(userId);
                if (!user) return;
                const success = room.getGame().word(userId, word);
                socket.broadcast.to(room.roomId).emit("WORD", { userId, success, word });
            });
        });
    }
}
