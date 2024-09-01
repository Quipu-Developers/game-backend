import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createPool } from "mysql2/promise";
import cors from "cors";
import "dotenv/config";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

export namespace Vars {
    const port = 8080;
    export const app = express();

    app.use(express.json());

    app.use(
        cors({
            origin: "*",
            credentials: true,
        })
    );

    const server = createServer(app);
    export const io = new Server(server, { cors: { origin: "*" } });

    export const sql = createPool({
        host: process.env.SQL_HOST,
        port: 3306,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWD,
        database: process.env.SQL_DBNAME,
        multipleStatements: true,
        connectionLimit: 3,
    });

    export let model: GenerativeModel;

    export async function initializeGemini() {
        const Gemini = new GoogleGenerativeAI(process.env.KRDICT_API_KEY);
        model = Gemini.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
    }

    export async function initialize() {
        server.listen({ port, host: "0.0.0.0" }, () => console.log("listening on port " + port));
    }
}
