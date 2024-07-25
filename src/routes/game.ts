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
    const { userId, userName, phoneNumber, score, teamId, teamName, remainingTime } = req.body;

    if (!Util.phoneNumberValidator(phoneNumber)) throw new Error("phoneNumber invalid");

    const created = await GameService.createUser({
        userId,
        userName,
        phoneNumber,
        score,
        teamId,
        teamName,
        remainingTime,
    });
    if (!created) throw new Error("already user exists");

    return res.json({ created });
});

//use GameService.deleteUser and GameService.updateUser

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
