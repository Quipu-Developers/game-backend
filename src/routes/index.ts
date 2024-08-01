import { Vars } from "../Vars";
import gameRouter from "./game";
import defaultRouter from "./default";
import roomRouter from "./room";

Vars.app.use("/api", gameRouter);
Vars.app.use("/api", defaultRouter);
Vars.app.use("/api", roomRouter);
