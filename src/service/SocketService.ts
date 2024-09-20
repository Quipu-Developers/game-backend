import { Util } from "../util";
import { Vars } from "../Vars";
import { DatabaseService } from "./DatabaseService";
import { LobbyService } from "./RoomService";

export namespace SocketService {
    export async function initialize() {
        listen();
    }

    function listen() {
        Vars.io.on("connection", (socket) => {
            socket.on("disconnect", async (reason) => {
                console.log("socket disconnected : ", reason);

                if (!socket.userId) return;

                const existingUser = LobbyService.getUser(socket.userId);
                if (!existingUser) return;
                LobbyService.deleteUser(socket.userId);

                const room = LobbyService.getRoomFromUserId(socket.userId);
                if (!room) return;
                room.removeMember(socket.userId);
                Vars.io.to(room.roomId).emit("LEAVEUSER", { userId: socket.userId });

                if (room.getUsers().length === 0) {
                    LobbyService.deleteRoom(room);
                    Vars.io.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                }
            });

            socket.on("RECONNECT", async ({ userName, phoneNumber }, callback) => {
                console.log("reconnect");
                const result = await DatabaseService.findUser({ userName, phoneNumber });

                if (!result.success) {
                    return callback({ success: false, errMsg: "해당 유저를 찾을 수 없습니다." });
                }

                // 새로운 소켓 ID로 갱신
                const existingUser = LobbyService.getUser(result.user?.userId);

                if (existingUser) {
                    existingUser.socketId = socket.id; // 소켓 ID 업데이트
                }

                socket.userId = result.user?.userId;
                const room = LobbyService.getRoomFromUserId(result.user?.userId);

                if (room) {
                    await socket.join(room.roomId); // 새로운 소켓 ID로 방에 재참여
                    Vars.io.to(room.roomId).emit("RECONNECT", { user: result.user });
                }

                callback({ success: true });
            });

            socket.on("LOGIN", async ({ userName, phoneNumber }: RequestList["LOGIN"], callback) => {
                const result = await DatabaseService.findUser({ userName, phoneNumber });

                const userNameValid = Util.userNameValidator(userName);
                if (!userNameValid.success) return callback(userNameValid);
                const phoneNumberValid = Util.phoneNumberValidator(phoneNumber);
                if (!phoneNumberValid.success) return callback(phoneNumberValid);

                if (!result.success) {
                    return callback({ success: false, errMsg: "해당 정보의 유저정보가 존재하지 않습니다." });
                }

                const existingUser = LobbyService.getUser(result.user?.userId);
                if (existingUser) {
                    return callback({ success: false, errMsg: "이미 해당 정보로 로그인한 유저가 존재합니다." });
                }

                LobbyService.addUser(result.user!, socket.id);
                socket.userId = result.user?.userId;

                await socket.join("lobby");
                Vars.io.to("lobby").emit("JOINLOBBY", { user: result.user });
                callback({ success: true, user: result.user });
            });

            socket.on("LOGOUT", async ({ userId }, callback) => {
                const user = LobbyService.getUser(userId);

                if (user) {
                    LobbyService.deleteUser(userId);

                    const room = LobbyService.getRoomFromUserId(userId);
                    if (room) {
                        room.removeMember(userId);
                        Vars.io.to(room.roomId).emit("LEAVEUSER", { userId });

                        if (room.getUsers().length === 0) {
                            LobbyService.deleteRoom(room);
                            Vars.io.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                        }
                    }

                    callback({ success: true });
                } else {
                    callback({ success: false, errMsg: "User not found" });
                }
            });

            socket.on("REGISTER", async ({ userName, phoneNumber }: RequestList["REGISTER"], callback) => {
                const userNameValid = Util.userNameValidator(userName);
                if (!userNameValid.success) return callback(userNameValid);
                const phoneNumberValid = Util.phoneNumberValidator(phoneNumber);
                if (!phoneNumberValid.success) return callback(phoneNumberValid);

                if ((await DatabaseService.findUser({ userName, phoneNumber })).success)
                    return callback({ success: false, errMsg: "계정이 중복됩니다." });
                const result = await DatabaseService.createUser({ userName, phoneNumber });

                callback(result);
            });

            socket.on("DELETEROOM", async ({}: RequestList["DELETEROOM"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });
                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 방을 제거할 수 있습니다." });

                await LobbyService.deleteRoom(room);
                socket.broadcast.to("lobby").emit("DELETEROOM", { roomId: room.roomId });
                socket.broadcast.to(room.roomId.toString()).emit("DELETEROOM", { roomId: room.roomId });
                await socket.leave(room.roomId.toString());
                await socket.join("lobby");
                callback({ success: true });
            });

            socket.on("KICKMEMBER", async ({ targetId }: RequestList["KICKMEMBER"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });
                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 강퇴할 수 있습니다." });

                const deleted = room.kickMember(targetId);
                callback({ success: deleted });
            });

            socket.on("GETROOMS", async ({}: RequestList["GETROOMS"], callback) => {
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

            socket.on("STARTGAME", async (data, callback = () => {}) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을 수 없습니다." });

                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                if (room.leader.userId !== user.userId)
                    return callback({ success: false, errMsg: "리더만 게임을 시작할 수 있습니다." });

                if (room.getGame().isStarted)
                    return callback({ success: false, errMsg: "게임이 이미 시작되었습니다." });

                await room.startGame(user.userId);

                Vars.io.to(room.roomId.toString()).emit("STARTGAME", { gameInfo: room.getGame().getGameInfo() });

                callback({ success: true, gameInfo: room.getGame().getGameInfo() });
            });

            socket.on("LEAVEROOM", async ({}: RequestList["LEAVEROOM"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                room.removeMember(user.userId);
                room.getGame().removeUser(user);
                socket.broadcast.to("lobby").emit("LEAVEUSER", { user, roomId: room.roomId });
                socket.broadcast.to(room.roomId.toString()).emit("LEAVEUSER", { user, roomId: room.roomId });
                await socket.leave(room.roomId.toString());
                await socket.join("lobby");
                callback({ success: true });
            });

            socket.on("JOINROOM", async ({ roomId }: RequestList["JOINROOM"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });
                const room = LobbyService.getRoom(roomId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                LobbyService.joinRoom(user, room);
                const users = room.getUsers();
                callback({ success: true, users: users });
                room.getGame().addUser(user);
                socket.broadcast.to(room.roomId).emit("JOINUSER", { user, roomId: room.roomId });
                socket.leave("lobby");
                socket.join(room.roomId);
                socket.broadcast.to("lobby").emit("JOINUSER", { user, roomId: room.roomId });
            });

            socket.on("CREATEROOM", async ({ roomName }: RequestList["CREATEROOM"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을수 없습니다." });

                const room = LobbyService.createRoom(user, roomName);

                socket.leave("lobby");
                socket.join(room.roomId);
                callback({ success: true, room });

                Vars.io.to("lobby").emit("CREATEROOM", {
                    roomId: room.roomId,
                    roomName: room.roomName,
                    users: room.getUsers(),
                    started: room.getGame().isStarted,
                });
            });

            socket.on("CHAT", ({ message }: RequestList["CHAT"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을 수 없습니다." });
                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                socket.broadcast.to(room.roomId.toString()).emit("CHAT", { userName: user.userName, message });
                callback({ success: true });
            });

            socket.on("WORD", async ({ word }: RequestList["WORD"], callback) => {
                const user = LobbyService.getUser(socket.userId);
                if (!user) return callback({ success: false, errMsg: "해당 유저를 로비에서 찾을 수 없습니다." });

                const room = LobbyService.getRoomFromUserId(user.userId);
                if (!room) return callback({ success: false, errMsg: "방이 존재하지 않습니다." });

                const success = await room.getGame().word(socket.userId!, word);
                if (success) {
                    socket.broadcast.to(room.roomId).emit("WORD", {
                        userId: socket.userId,
                        success,
                        word,
                        gameInfo: room.getGame().getGameInfo(),
                    });

                    callback({ success: true, gameInfo: room.getGame().getGameInfo() });
                } else {
                    callback({ success: false });
                }
            });
        });
    }
}
