import { config } from "dotenv";
import { Vars } from "./Vars";
import "./routes";
import { DatabaseService, SocketService } from "./service";
config();

(async () => {
    await Vars.initializeGemini();
    await Vars.initialize();
    await SocketService.initialize();

    console.log(JSON.stringify(await DatabaseService.getGameEndInfo(44), null, 2));
})();
