import { Util } from "../util";
import { GameService } from "../service";
import { Vars } from "../Vars";

Vars.app.get("/api/game-end", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "number") throw new Error("userId must be number");
    const gameEndInfo = await GameService.getGameEndInfo(userId);
    if (!gameEndInfo) throw new Error("gameUser is not found");

    return gameEndInfo;
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

    return created;
});

//use GameService.deleteUser and GameService.updateUser

Vars.app.post("/api/delete-user", async (req, res) => {
    const userId = req.query.userId;

    sql.query('DELETE FROM users WHERE userid = ?', [userId], (error, results) => {
        if (error) {
            res.status(500).send({ message: 'An error occurred', error: error.message });
        } else if (results.affectedRows > 0) {
            res.status(200).send({ message: 'User deleted successfully' });
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});

Vars.app.post("/api/update-user", async (req, res) => {
    const { userid, userinfo } = req.body;

    if (!userid || !userinfo) {
        return res.status(400).send({ message: 'userId and userinfo are required' });
    }

    sql.query('INSERT INTO users (userId, userinfo) VALUES (?, ?)', [userid, userinfo], (error, results) => {
        if (error) {
            res.status(500).send({ message: 'An error occurred', error: error.message });
        } else {
            res.status(201).send({ message: 'User added successfully', userId: results.insertId });
        }
    });
});
