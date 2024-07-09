import { Vars } from "../Vars";
import { GameService } from "../service";

Vars.app.get("/api/words", async (req, res) => {
    try {
        const words = await GameService.getWords();

        return { words };
    } catch (error) {
        return { isWordValid: false };
    }
});
