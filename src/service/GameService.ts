import { RowDataPacket } from "mysql2";
import { Vars } from "../Vars";

export namespace GameService {
    export async function getGameEndInfo(userId: string) {
        const conn = await Vars.sql.getConnection();
        const [list] = await conn.query<RowDataPacket[]>("SELECT * FROM Users");

        conn.release();

        // const users = await Users.find({}).sort({ score: 1 });
        // const user = users.find((user) => user.userId == userId);
        // if (!user) return;
        // const globalRank = users.findIndex((user) => user.userId == userId);
        return {
            top10GlobalRankings: [
                {
                    userId: "0",
                    userName: "0",
                    score: 0,
                },
            ],
            personalRanking: {
                userId: "",
                userName: "user.userName",
                score: 0,
                globalRank: 10,
            },
        };
    }

    export async function createUser(info: DefaultGameUserInfo) {
        // const isExist = await Users.exists({ userId: info.userId });
        // if (isExist) return false;
        // await Users.create({
        //     ...info,
        //     score: 0,
        // });
        return true;
    }

    export async function getWords() {
        return ["바나나", "사과나", "딸기야"];
    }
}
