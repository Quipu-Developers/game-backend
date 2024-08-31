import { Game } from "./GameService";
import { v4 as uuidv4 } from "uuid";

export namespace LobbyService {
    const roomList: Room[] = [];
    export const lobbyUsers: LobbyUserInfo[] = [];

    export function getUser(userId?: number) {
        return lobbyUsers.find((v) => v.userId == userId);
    }

    export function deleteUser(userId?: number) {
        const deleted = lobbyUsers.splice(
            lobbyUsers.findIndex((user) => user.userId == userId),
            1
        );
        return deleted;
    }

    export function getRoomFromUserId(userId?: number) {
        const user = getUser(userId);
        if (!user) return;

        return roomList.find((room) => room.roomId == user.roomId);
    }

    export async function addUser(user: DefaultUserInfo) {
        lobbyUsers.push(user);
    }

    export function getRoom(roomId: string) {
        return roomList.find((v) => v.roomId == roomId);
    }

    export function getRooms() {
        return roomList;
    }

    export function createRoom(creator: LobbyUserInfo, roomName: string) {
        const roomId = uuidv4();
        const game = new Game(roomId);
        game.addUser(creator);

        const room = new Room(game, roomId, roomName);
        roomList.push(room);
        room.addUser(creator, "leader");

        creator.roomId = room.roomId;

        return room;
    }

    export async function deleteRoom(room: Room) {
        roomList.splice(
            roomList.findIndex((item) => item.roomId == room.roomId),
            1
        );
    }

    export async function joinRoom(user: LobbyUserInfo, room: Room) {
        user.roomId = room.roomId;
        room.addUser(user, "normal");
    }
}

export class Room {
    private users: RoomUserInfo[] = [];
    private game: Game;
    public chat: { userId: number; text: string }[] = [];

    constructor(game: Game, public roomId: string, public roomName: string) {
        this.game = game;
    }

    public kickMember(userId: number) {
        const deleted = this.users.splice(
            this.users.findIndex((user) => user.userId == userId),
            1
        );
        return deleted.length > 0;
    }

    public get leader() {
        const leader = this.users.find((v) => v.power == "leader");
        if (!leader) throw new Error("can't find leader");
        return leader;
    }

    public getUsers() {
        return this.users;
    }

    public getGame() {
        return this.game;
    }

    private getUser(userId?: number) {
        return this.users.find((v) => v.userId == userId);
    }

    addUser(user: DefaultUserInfo, power: RoomPower) {
        this.users.push({ ...user, roomId: this.roomId, power });
    }

    addChat(userId: number, text: string) {
        this.chat.push({ userId, text });
    }

    startGame(userId: number) {
        const user = this.getUser(userId);
        if (!user) return;

        if (user.power == "leader") {
            this.game.startGame();
        }
    }
}
