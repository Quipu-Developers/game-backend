import { DatabaseService } from "./DatabaseService";
import { Game } from "./GameService";

export namespace RoomService {
    const roomList: Room[] = [];
    export const users: DefaultGameUserInfo[] = [];

    export function getUser(userId: number) {
        return users.find((v) => v.userId == userId);
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

    export async function joinRoom(user: DefaultGameUserInfo, roomId: string) {
        const room = getRoom(roomId);

        if (!room) return false;

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
    public ready = false;
    chat: { userId: number; text: string }[] = [];

    constructor(game: Game, public roomId: string, public roomName: string) {
        this.game = game;
    }

    kickMember(userId: number) {
        this.users = this.users.filter((item) => item.userId != userId);

        // this.users.splice(this.users.findIndex((v)=>v.userId == userId) , 1)
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

    getUser(userId: number) {
        return this.users.find((v) => v.userId == userId);
    }

    addUser(user: DefaultGameUserInfo, power: RoomPower) {
        this.users.push({ ...user, power });
    }

    async setTeam(teamName: string) {
        const { teamId } = await DatabaseService.createTeam({ teamName });
        for (const user of this.users) {
            await DatabaseService.updateUserInfo(user.userId, { teamId });
        }

        this.ready = true;
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
