import { config } from "dotenv";
import { Vars } from "./Vars";
import "./routes";
import { SocketService } from "./service";
import { GameWords } from "./constants";
config();

(async () => {
    console.log(GameWords.length);
    await Vars.initialize();
    await SocketService.initialize();
})();
