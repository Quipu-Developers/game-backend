import { Vars } from "../Vars";

Vars.app.get("/info", async (req, res) => {
    return { success: true };
});
