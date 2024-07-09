import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { connect } from "mongoose";

export namespace Vars {
    const port = 8080;
    export const app = express();
    const server = createServer(app);
    export const io = new Server(server, { cors: { origin: "*" } });

    export async function initialize() {
        await connect(process.env.MONGO_DBURL, {
            dbName: process.env.MONGO_DBNAME,
        });

        server.listen({ port, host: "0.0.0.0" }, () =>
            console.log("listening on port " + port)
        );
    }
}
