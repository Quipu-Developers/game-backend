import { Vars } from "../Vars";
import { v4 as uuidv4 } from "uuid";
import { Game } from "./GameService";
import { DatabaseService } from "./DatabaseService";
import { Room, LobbyService } from "./RoomService";

export namespace SocketService {
    export async function initialize() {
        listen();
    }

    function listen() {
        Vars.io.on("connection", (socket) => {
            socket.on("disconnect", async (reason) => {
                console.log("socket disconnected : ", reason);

                if (!socket.userId) return;
                LobbyService.deleteUser(socket.userId);

                if (socket.rooms.has("lobby")) {
                    Vars.io.emit("LEAVELOBBY", socket.userId);
                }

                const room = LobbyService.getRoomFromUserId(socket.userId);
                if (room) {
                    await LobbyService.deleteRoom(room);
                    socket.broadcast.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                    socket.broadcast.to(room.roomId.toString()).emit("DELETEROOM", {});
                }
            });

            socket.on("LOGIN", async ({ userName, phoneNumber }: AuthPacket, callback) => {
                const result = await DatabaseService.findUser({ userName, phoneNumber });
                if (!result.success) return callback(result);
                if (LobbyService.getUser(result.user?.userId)) {
                    return callback({ success: false, errMsg: "이미 해당 정보로 로그인한 유저가 존재합니다." });
                }
                LobbyService.addUser(result.user!);
                socket.userId = result.user?.userId;
                await socket.join("lobby");
                Vars.io.to("lobby").emit("JOINLOBBY", result.user);
                callback(result);
            });

            socket.on("REGISTER", async ({ userName, phoneNumber }: AuthPacket, callback) => {
                const result = await DatabaseService.createUser({ userName, phoneNumber });
                if (result.success) {
                    LobbyService.lobbyUsers.push({
                        userId: result.userId,
                        userName,
                        phoneNumber,
                        score: 0,
                    });
                }
                callback(result);
            });

            socket.on("DELETEUSER", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });

                const deleted = DatabaseService.deleteUserInfo(user.userId);

                return callback({ success: deleted });
            });

            socket.on("DELETEROOM", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });
                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 방을 제거할 수 있습니다." });

                await LobbyService.deleteRoom(room);
                socket.broadcast.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                socket.broadcast.to(room.roomId.toString()).emit("DELETEROOM", {});
                callback({ success: true });
            });

            socket.on("KICKMEMBER", async ({ targetId }: { targetId: number }, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });
                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 강퇴할 수 있습니다." });

                const deleted = room.kickMember(targetId);
                callback({ success: deleted });
            });

            socket.on("GETROOMS", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const rooms = LobbyService.getRooms();
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

            socket.on("STARTGAME", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 게임을 시작할수 있습니다." });
                room.getGame().startGame();

                callback({ success: true });
                Vars.io.to(room.roomId.toString()).emit("STARTGAME", { gameInfo: room.getGame().getGameInfo() });
            });

            socket.on("LEAVEROOM", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                socket.broadcast.to("lobby").emit("LEAVEUSER", { user, roomId: room.roomId });
                socket.broadcast.to(room.roomId.toString()).emit("LEAVEUSER", user);
            });

            socket.on("JOINROOM", async ({}, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                LobbyService.joinRoom(user, room);
                const users = room.getUsers();
                callback({ success: true, users: users });
                socket.broadcast.to(room.roomId.toString()).emit("JOINUSER", user);
                socket.leave("lobby");
                socket.join(room.roomId.toString());
                socket.broadcast.to("lobby").emit("JOINUSER", { user, roomId: room.roomId });
            });

            socket.on("CREATEROOM", async ({ roomName }: { roomName: string }, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });

                const roomId = uuidv4();
                const game = new Game(roomId);
                game.addUser(user);

                const room = new Room(game, roomId, roomName);
                LobbyService.addRoom(room);
                room.addUser(user, "leader");

                socket.leave("lobby");
                callback({ success: true, room });

                Vars.io.to("lobby").emit("CREATEROOM", {
                    roomId: room.roomId,
                    roomName: room.roomName,
                    users: room.getUsers(),
                    started: room.getGame().isStarted,
                });
            });

            socket.on("CHAT", ({ message }: { message: string }, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                socket.broadcast.to(room.roomId).emit("CHAT", { userName: user.userName, message });
            });

            socket.on("WORD", ({ word }: { word: string }, callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });
                const success = room.getGame().word(socket.userId!, word);
                socket.broadcast.to(room.roomId).emit("WORD", { userId: socket.userId!, success, word });
            });
        });
    }
}
