import { Vars } from "../Vars";

export namespace SocketService {
    export async function initialize() {
        listen();
    }

    const gameList: Game[] = [];

    class Game {
        private users: DefaultGameUserInfo[] = [];
    }

    function listen() {
        Vars.io.on("connection", (socket) => {
            socket.on("STARTGAME", () => {
                const game = new Game();
                gameList.push(game);
            });
        });
    }
}
