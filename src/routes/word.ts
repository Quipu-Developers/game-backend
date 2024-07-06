import { FastifyInstance } from "fastify";
import request from "request";
import xml2js from "xml2js";

export async function wordRoute(app: FastifyInstance) {
    app.get<{ Querystring: { text: string } }>(
        "/api/words",
        async (req, res) => {
            try {
                const word = req.query.text;
                const isWordValid = await wordCheck(word);

                return { isWordValid };
            } catch (error) {
                return { isWordValid: false };
            }
        }
    );
}

async function wordCheck(word: string) {
    const url = `https://krdict.korean.go.kr/api/search`;
    const option = {
        url: url,
        qs: {
            key: process.env.KRDICT_API_KEY,
            q: word,
            type1: "word",
            part: "word",
            pos: 1,
            method: "exact",
        },
    };

    return new Promise<boolean>((resolve, reject) => {
        request(option, (err, response, body) => {
            xml2js.parseString(
                body,
                { explicitArray: false },
                (err, result) => {
                    console.log(result);
                    if (err) reject(err);
                    if (!result.channel) {
                        reject();
                        return;
                    }
                    if (result.channel.total === "0") {
                        resolve(false);
                    } else {
                        let w;
                        if (result.channel.item[0] !== undefined) {
                            w = result.channel.item[0].word;
                        } else {
                            w = result.channel.item.word;
                        }
                        if (w === word) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                }
            );
        });
    });
}
