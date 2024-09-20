import { config } from "dotenv";
import { Vars } from "./Vars";
import "./routes";
import { SocketService } from "./service";
config();

(async () => {
    await Vars.initializeGemini();
    await Vars.initialize();
    await SocketService.initialize();
})();
