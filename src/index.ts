import fastify, { FastifyInstance } from "fastify";
import { wordRoute } from "./routes";

import { config } from "dotenv";
config();

const Application: FastifyInstance = fastify();

wordRoute(Application);

Application.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
