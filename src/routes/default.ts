import { Vars } from "../Vars";

Vars.app.get("/info", async (req, res) => {
    return res.json({ success: true });
});
