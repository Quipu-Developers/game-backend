import { Vars } from "../Vars";
import { DatabaseService } from "./DatabaseService";
import { LobbyService } from "./RoomService";

export class Game {
    public users: DefaultUserInfo[] = [];
    public words: string[] = [];
    public isStarted = false;
    public startTime?: number;
    public timer?: NodeJS.Timeout;

    constructor(public roomId: string) {}

    public getGameInfo() {
        return {
            words: this.words,
            isStarted: this.isStarted,
            users: this.users,
        };
    }

    public getUser(userId: number) {
        return this.users.find((user) => user.userId == userId);
    }

    public addUser(user: DefaultUserInfo) {
        this.users.push(user);
    }

    public removeUser(user: DefaultUserInfo) {
        this.users.splice(this.users.indexOf(user), 1);
    }

    public async word(userId: number, word: string) {
        const user = this.getUser(userId);
        if (!user) return false;

        const deleted = this.words.splice(this.words.indexOf(word), 1);
        if (deleted.length == 0) return false;

        user.score += 10;

        if (this.words.length == 0) {
            this.words = await DatabaseService.getWords(84);
            Vars.io.to(this.roomId.toString()).emit("NEWWORDS", { words: this.words });
        }

        return true;
    }

    public async startGame() {
        this.isStarted = true;
        this.startTime = Date.now();
        this.words = await DatabaseService.getWords(84);

        this.timer = setTimeout(() => {
            this.endGame();
        }, 1000 * 60);
    }

    public async endGame() {
        if (!this.startTime) throw new Error("can't end game without startTime");

        clearTimeout(this.timer);

        await Promise.all(this.users.map((user) => DatabaseService.updateUserInfo(user.userId, { score: user.score })));

        Vars.io.to(this.roomId).emit("ENDGAME", { users: this.users });
        const sockets = await Vars.io.sockets.in(this.roomId).fetchSockets();

        for (const socket of sockets) {
            socket.leave(this.roomId);
        }

        await LobbyService.deleteRoom(LobbyService.getRoom(this.roomId)!);
        Vars.io.to("lobby").emit("DELETEROOM", { roomId: this.roomId });
        Vars.io.to(this.roomId).emit("DELETEROOM", { roomId: this.roomId });
    }
}
