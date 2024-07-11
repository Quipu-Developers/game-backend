import { RowDataPacket } from "mysql2";
import { Vars } from "../Vars";

export namespace GameService {
    export async function getGameEndInfo(userId: string) {
        const conn = await Vars.sql.getConnection();
        const [list] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");

        conn.release();

        //console.log(list)
        // const users = await Users.find({}).sort({ score: 1 });
        // const user = users.find((user) => user.userId == userId);
        // if (!user) return;
        // const globalRank = users.findIndex((user) => user.userId == userId);
        /*
        return {
            top10GlobalRankings: [
                {
                    userId: "0",
                    userName: "0",
                    score: 0,
                    phoneNumber:"01012345678",
                },
            ],
            personalRanking: {
                userId: "",
                userName: "user.userName",
                score: 0,
                globalRank: 10,
            },
        };
        */
        //추후에 순위 중복문제 해결 예정
        const index: number = list.findIndex((item) => item.userId === userId);
        const userName: string = `${list[index].userName}`;
        const score: number = list[index].score;
        const globalRank: number = index + 1;
        let length: number = list.length;
        if (length > 10) {
            length = 10;
        }
        let top10GlobalRankings: RowDataPacket[] = list.splice(0, length);

        return {
            top10GlobalRankings: top10GlobalRankings,
            personalRanking: {
                userid: `${userId}`,
                userName: userName,
                score: score,
                globalRank: globalRank,
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

        console.log(info);
        // const conn = await Vars.sql.getConnection();
        // conn.query<RowDataPacket[]>(`INSERT Users VALUES ("${info.userId}","${info.userName}",${info.score},"${info.phoneNumber}");`);

        return true;
    }

    export async function getWords() {
        return ["바나나", "사과나", "딸기야"];
    }
}
