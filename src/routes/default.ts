import { Router } from "express";

const defaultRouter = Router();

defaultRouter.get("/info", async (req, res) => {
    return res.json({ success: false });
});

export default defaultRouter;
