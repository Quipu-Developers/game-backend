import { config } from "dotenv";
import { Vars } from "./Vars";
import "./routes";
config();

(async () => {
    await Vars.initialize();
})();
