import { DatabaseService } from "../service";
import { Util } from "../util";
import { Router } from "express";

const gameRouter = Router();

gameRouter.get("/game-end", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "number") throw new Error("userId must be number");
    const gameEndInfo = await DatabaseService.getGameEndInfo(userId);
    if (!gameEndInfo) throw new Error("gameUser is not found");

    return res.json(gameEndInfo);
});

gameRouter.post("/create-user", async (req, res) => {
    const { userName, phoneNumber } = req.body;

    if (!Util.phoneNumberValidator(phoneNumber)) throw new Error("phoneNumber invalid");

    const { userId } = await DatabaseService.createUser({
        userName,
        phoneNumber,
    });

    return res.json({ userId });
});

gameRouter.post("/delete-user", async (req, res) => {
    const { userId } = req.body;

    const success = await DatabaseService.deleteUserInfo(userId);

    return res.json({ success });
});

gameRouter.post("/update-user", async (req, res) => {
    const { userId, info } = req.body;

    const success = await DatabaseService.updateUserInfo(userId, info);

    return res.json({ success });
});

export default gameRouter;
