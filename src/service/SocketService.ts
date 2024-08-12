import { GameWords } from "../constants";
import { Vars } from "../Vars";
import { v4 as uuidv4 } from "uuid";
import { GameService } from "./GameService";

export namespace SocketService {
    export async function initialize() {
        listen();
    }

    const gameList = new Map<string, Game>();

    class Game {
        public users: DefaultGameUserInfo[] = [];
        public words: string[] = GameWords;
        public isStarted = false;
        public startTime?: number;
        public timer?: NodeJS.Timeout;

        constructor(public gameId: string, public teamId: number) {}

        public getGameInfo() {
            return {
                gameId: this.gameId,
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
            for (const user of this.users) {
                await GameService.updateUserInfo(user.userId, { teamId: this.teamId });
            }

            Vars.io.to(this.teamId.toString()).emit("STARTGAME", { gameInfo: this.getGameInfo() });
        }

        public endGame() {
            if (!this.startTime) throw new Error("can't end game without startTime");
            const timeScore = Math.floor((Date.now() - this.startTime) / 1000) * 10;

            clearTimeout(this.timer);
            gameList.delete(this.gameId);

            Vars.io.to(this.teamId.toString()).emit("ENDGAME", { gameInfo: this.getGameInfo(), timeScore });
        }
    }

    function listen() {
        Vars.io.on("connection", (socket) => {
            socket.on("JOINGAME", async ({ userInfo, gameId }: JoinGamePacket, callback) => {
                let game = gameList.get(gameId);
                if (!game) {
                    const uuid = uuidv4();
                    const { teamId } = await GameService.createTeam({});
                    socket.join(`${teamId}`);
                    game = new Game(uuid, teamId);

                    game.addUser({ score: 0, ...userInfo });
                    gameList.set(uuid, game);
                }

                callback({
                    success: true,
                    game: game.getGameInfo(),
                });

                game.addUser({ score: 0, ...userInfo });

                socket.broadcast.to(game.teamId.toString()).emit("JOINUSER", { userInfo });

                if (game.users.length == 2) {
                    await game.startGame();
                    game.timer = setTimeout(() => {
                        game.endGame();
                    }, 1000 * 50);
                }
            });

            socket.on("CHAT", ({ userInfo, gameId, message }: ChatPacket, callback) => {
                const game = gameList.get(gameId);
                if (!game) {
                    callback({
                        success: false,
                        errMsg: "해당 게임을 찾을 수 없습니다.",
                    });
                    return;
                }

                socket.broadcast.to(game.teamId.toString()).emit("WORD", { userId: userInfo.userId, message });
            });

            socket.on("WORD", ({ userInfo, gameId, word }: WordPacket, callback) => {
                const game = gameList.get(gameId);
                if (!game) {
                    callback({
                        success: false,
                        errMsg: "해당 게임을 찾을 수 없습니다.",
                    });
                    return;
                }

                const success = game.word(userInfo.userId, word);
                socket.broadcast
                    .to(game.teamId.toString())
                    .emit("WORD", { userId: userInfo.userId, success, word, gameInfo: game.getGameInfo() });
            });
        });
    }
}
