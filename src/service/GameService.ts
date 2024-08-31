import { Vars } from "../Vars";
import { GameWords } from "../constants";
import { Room, RoomService } from "./RoomService";
import { DatabaseService } from "./DatabaseService";

export class Game {
    public users: DefaultGameUserInfo[] = [];
    public words: string[] = GameWords;
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

    public addUser(user: DefaultGameUserInfo) {
        this.users.push(user);
    }

    public removeUser(user: DefaultGameUserInfo) {
        this.users.splice(this.users.indexOf(user), 1);
    }

    public word(userId: number, word: string) {
        const user = this.getUser(userId);
        if (!user) return false;

        const deleted = this.words.splice(this.words.indexOf(word), 1);
        if (deleted.length == 0) return false;

        user.score += 10;

        if (this.words.length == 0) {
            this.endGame();
        }
        return true;
    }

    public async startGame() {
        this.isStarted = true;
        this.startTime = Date.now();

        Vars.io.to(this.roomId.toString()).emit("STARTGAME", { gameInfo: this.getGameInfo() });
    }

    public async endGame() {
        if (!this.startTime) throw new Error("can't end game without startTime");
        const timeScore = Math.floor((Date.now() - this.startTime) / 1000) * 10;

        clearTimeout(this.timer);

        let totalScore = 0;

        totalScore += timeScore;

        for (const user of this.users) {
            totalScore += user.score;
        }

        await DatabaseService.updateTeamInfo(RoomService.getRoom(this.roomId)!.leader.teamId, { score: totalScore });

        Vars.io.to(this.roomId).emit("ENDGAME", { timeScore, totalScore });
        const sockets = await Vars.io.sockets.in(this.roomId).fetchSockets();

        for (const socket of sockets) {
            socket.leave(this.roomId);
        }
    }
}