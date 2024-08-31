import { Game } from "./GameService";

export namespace RoomService {
    const roomList: Room[] = [];
    export const users: (DefaultGameUserInfo & { roomId?: string })[] = [];

    export function getUser(userId?: number) {
        return users.find((v) => v.userId == userId);
    }

    export function getRoomFromUserId(userId?: number) {
        const user = getUser(userId);
        if (!user) return;

        return roomList.find((room) => room.roomId == user.roomId);
    }

    export async function addUser(user: DefaultGameUserInfo) {
        users.push(user);
    }

    export function getRoom(roomId: string) {
        return roomList.find((v) => v.roomId == roomId);
    }

    export function getRooms() {
        return roomList;
    }

    export async function addRoom(room: Room) {
        roomList.push(room);
    }

    export async function deleteRoom(roomId: string) {
        roomList.splice(
            roomList.findIndex((item) => item.roomId == roomId),
            1
        );
    }

    export async function joinRoom(userId: number, roomId: string) {
        const user = getUser(userId);
        if (!user) return false;

        const room = getRoom(roomId);
        if (!room) return false;

        user.roomId = room.roomId;
        room.addUser(user, "normal");
    }
}

type RoomPower = "leader" | "normal";

type RoomUserInfo = DefaultGameUserInfo & {
    power: RoomPower;
};

export class Room {
    private users: RoomUserInfo[] = [];
    private game: Game;
    chat: { userId: number; text: string }[] = [];

    constructor(game: Game, public roomId: string, public roomName: string) {
        this.game = game;
    }

    kickMember(userId: number) {
        this.users = this.users.filter((item) => item.userId != userId);
    }

    get leader() {
        const leader = this.users.find((v) => v.power == "leader");
        if (!leader) throw new Error("can't find leader");
        return leader;
    }

    getUsers() {
        return this.users;
    }

    getGame() {
        return this.game;
    }

    getUser(userId?: number) {
        return this.users.find((v) => v.userId == userId);
    }

    addUser(user: DefaultGameUserInfo, power: RoomPower) {
        this.users.push({ ...user, power });
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
