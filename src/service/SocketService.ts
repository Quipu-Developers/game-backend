import { GameWords } from "../constants";
import { Vars } from "../Vars";
import { v4 as uuidv4 } from "uuid";

export namespace SocketService {
    export async function initialize() {
        listen();
    }

    const gameList = new Map<string, Game>();

    class Game {
        public users: DefaultGameUserInfo[] = [];
        public words: string[] = GameWords;
        public isStarted = false;
        public gameId: string;
        public startTime?: number;
        public timer?: NodeJS.Timeout;

        constructor(gameId: string) {
            this.gameId = gameId;
        }

        public getGameInfo() {
            return {
                gameId: this.gameId,
                words: this.words,
                isStarted: this.isStarted,
                users: this.users,
            };
        }

        public getUser(userId: string) {
            return this.users.find((user) => user.userId == userId);
        }

        public addUser(user: DefaultGameUserInfo) {
            this.users.push(user);
        }

        public removeUser(user: DefaultGameUserInfo) {
            this.users.splice(this.users.indexOf(user), 1);
        }

        public word(userId: string, word: string) {
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

        public startGame() {
            this.isStarted = true;
            this.startTime = Date.now();

            Vars.io.emit("STARTGAME", { gameInfo: this.getGameInfo() });
        }

        public endGame() {
            if (!this.startTime) throw new Error("can't end game without startTime");
            const timeScore = Math.floor((Date.now() - this.startTime) / 1000) * 10;

            clearTimeout(this.timer);
            gameList.delete(this.gameId);

            Vars.io.emit("ENDGAME", { gameInfo: this.getGameInfo(), timeScore });
        }
    }

    function listen() {
        Vars.io.on("connection", (socket) => {
            console.log("connected");

            socket.on("JOINGAME", ({ userInfo, gameId }: JoinGamePacket) => {
                let game = gameList.get(gameId);
                if (!game) {
                    const uuid = uuidv4();
                    game = new Game(uuid);

                    game.addUser({ score: 0, ...userInfo });
                    gameList.set(uuid, game);
                }

                game.addUser({ score: 0, ...userInfo });

                Vars.io.emit("JOINUSER", { userInfo });

                return {
                    success: true,
                    game: game.getGameInfo(),
                };
            });

            socket.on("STARTGAME", ({ gameId }: StartGamePacket) => {
                const game = gameList.get(gameId);
                if (!game) {
                    return {
                        success: false,
                        errMsg: "해당 게임을 찾을 수 없습니다.",
                    };
                }

                game.startGame();
                game.timer = setTimeout(() => {
                    game.endGame();
                }, 1000 * 50);

                return { success: true };
            });

            socket.on("WORD", ({ userInfo, gameId, word }: WordPacket) => {
                const game = gameList.get(gameId);
                if (!game) {
                    return {
                        success: false,
                        errMsg: "해당 게임을 찾을 수 없습니다.",
                    };
                }

                const success = game.word(userInfo.userId, word);
                Vars.io.emit("WORD", { userId: userInfo.userId, success, word, gameInfo: game.getGameInfo() });

                return { success, game };
            });
        });
    }
}
