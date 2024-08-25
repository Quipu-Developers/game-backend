import { config } from "dotenv";
import { Vars } from "./Vars";
import "./routes";
import { SocketService } from "./service";
config();

(async () => {
    await Vars.initialize();
    await SocketService.initialize();
    await Vars.initializeGemini();
})();
