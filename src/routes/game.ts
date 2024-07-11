import { Util } from "../util";
import { GameService } from "../service";
import { Vars } from "../Vars";

Vars.app.get("/api/game-end", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "string") throw new Error("userId must be string");
    const gameEndInfo = await GameService.getGameEndInfo(userId);
    if (!gameEndInfo) throw new Error("gameUser is not found");

    return gameEndInfo;
});

Vars.app.post("/api/create-user", async (req, res) => {
    const { userId, userName, phoneNumber, score } = req.body;
    console.log(req.body);
    if (!Util.phoneNumberValidator(phoneNumber)) throw new Error("phoneNumber invalid");

    const created = await GameService.createUser({
        userId,
        userName,
        phoneNumber,
        score,
    });
    if (!created) throw new Error("already user exists");

    return created;
});
