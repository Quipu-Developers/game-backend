import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Vars } from "./../Vars";
import _ from "lodash";

export namespace DatabaseService {
    const userTableName = process.env.PRODUCTION == "dev" ? "Test_Users" : "Users";

    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>(`SELECT * FROM ${userTableName} ORDER BY score DESC;`);

        conn.release();
        const personalIndex = personalList.findIndex((item) => item.userId === userId);

        if (!personalList[personalIndex])
            return {
                success: false,
                errMsg: "해당 유저를 찾을 수 없습니다.",
            };

        return {
            success: true,
            personalRank: {
                rank: personalIndex + 1,
                userId: userId,
                userName: personalList[personalIndex].userName,
                score: personalList[personalIndex].score,
            },
            top10: _.chain(personalList)
                .filter((user) => !["quipu", "quipu2", "quipu3"].includes(user.userName))
                .map((user, rank) => ({ ...user, rank: +rank + 1 }))
                .groupBy("score")
                .toArray()
                .reverse()
                .map((group) => group.map((user) => ({ ...user, rank: group[0].rank })))
                .flatMap()
                .slice(0, 10),
        };
    }

    export async function getGameEndInfoRanks(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [list] = await conn.query<RowDataPacket[]>(`SELECT * FROM ${userTableName} ORDER BY score DESC;`);
        conn.release();

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

    export async function findUser(info: { userName: string; phoneNumber: string }) {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<RowDataPacket[]>(
            `SELECT * FROM ${userTableName} WHERE userName = ? AND phoneNumber = ?`,
            [info.userName, info.phoneNumber]
        );
        conn.release();

        if (result.length > 0) {
            return {
                success: true,
                user: {
                    userId: result[0].userId,
                    userName: info.userName,
                    phoneNumber: info.phoneNumber,
                    score: result[0].score,
                },
            };
        }

        return { success: false, errMsg: "" };
    }

    export async function createUser(info: { userName: string; phoneNumber: string }) {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO ${userTableName} (userName, phoneNumber) VALUES (?, ?);`,
            [info.userName, info.phoneNumber]
        );
        conn.release();

        const userId = result.insertId;

        return { success: true, userId };
    }

    export async function updateUserInfo(userId: number, info: Partial<DefaultUserInfo>) {
        const conn = await Vars.sql.getConnection();

        conn.query<RowDataPacket[]>(
            `
                    UPDATE ${userTableName}
                    SET ?
                    WHERE userId = ?;
                `,
            [info, userId]
        );
        conn.release();
        return true;
    }

    export async function deleteUserInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        conn.query<RowDataPacket[]>(`DELETE FROM ${userTableName} WHERE ?;`, [{ userId }]);
        conn.release();
        return true;
    }
}
