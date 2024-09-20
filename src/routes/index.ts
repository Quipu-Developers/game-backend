import { Vars } from "../Vars";
import gameRouter from "./game";
import defaultRouter from "./default";

Vars.app.use("/api", gameRouter);
Vars.app.use("/api", defaultRouter);

Vars.app.get("/healthcheck", (req, res) => {
    res.send("OK");
});
