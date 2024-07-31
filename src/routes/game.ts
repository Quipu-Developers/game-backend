import { Util } from "../util";
import { GameService } from "../service";
import { Vars } from "../Vars";

Vars.app.get("/api/game-end", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "number") throw new Error("userId must be number");
    const gameEndInfo = await GameService.getGameEndInfo(userId);
    if (!gameEndInfo) throw new Error("gameUser is not found");

    return res.json(gameEndInfo);
});

Vars.app.post("/api/create-user", async (req, res) => {
    const { userName, phoneNumber } = req.body;

    if (!Util.phoneNumberValidator(phoneNumber)) throw new Error("phoneNumber invalid");

    const { userId } = await GameService.createUser({
        userName,
        phoneNumber,
    });

    return res.json({ userId });
});

Vars.app.post("/api/delete-user", async (req, res) => {
    const { userId } = req.body;

    const success = await GameService.deleteUserInfo(userId);

    return res.json({ success });
});

Vars.app.post("/api/update-user", async (req, res) => {
    const { userId, info } = req.body;

    const success = await GameService.updateUserInfo(userId, info);

    return res.json({ success });
});
