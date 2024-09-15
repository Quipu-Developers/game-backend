import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Vars } from "./../Vars";

export namespace DatabaseService {
    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM Users WHERE userName NOT IN ('관리자1', '관리자2', '관리자3') ORDER BY score DESC;"
        );

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
            top10: personalList.slice(0, 10),
        };
    }

    export async function getGameEndInfoRanks(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [list] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
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
            `SELECT * FROM Users WHERE userName = ? AND phoneNumber = ?`,
            [info.userName, info.phoneNumber]
        );
        conn.release();

        if (result.length > 0) {
            return {
                success: true,
                user: { userId: result[0].userId, userName: info.userName, phoneNumber: info.phoneNumber, score: 0 },
            };
        }

        return { success: false, errMsg: "" };
    }

    export async function createUser(info: { userName: string; phoneNumber: string }) {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO Users (userName, phoneNumber) VALUES (?, ?);`,
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
                    UPDATE Users
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
        conn.query<RowDataPacket[]>(`DELETE FROM Users WHERE ?;`, [{ userId }]);
        conn.release();
        return true;
    }

    export async function getWords(num: number) {
        const chat = Vars.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "한글 단어를 생성해야해 근데 다음 조건들을 만족시켜야해" }],
                },
                {
                    role: "model",
                    parts: [{ text: "한글 단어 생성 조건을 알려주세요!" }],
                },
                {
                    role: "user",
                    parts: [{ text: "1. 3글자로 이루어진 한글 단어이어야해" }],
                },
                {
                    role: "model",
                    parts: [{ text: "좀 더 구체적인 조건을 알려주시면 더욱 멋진 단어를 만들어 드릴 수 있습니다." }],
                },
                {
                    role: "user",
                    parts: [{ text: "2. 사전에 있는 단어일수록 좋아" }],
                },
                {
                    role: "model",
                    parts: [
                        {
                            text: "어떤 분위기의 단어를 원하시는지 알려주시면 더욱 딱 맞는 단어를 찾아드릴 수 있습니다.",
                        },
                    ],
                },
            ],
        });

        const result: string = (
            await chat.sendMessage(`위 조건을 만족시키는 단어 ${num}개를 json 형식으로 출력해줘`)
        ).response.text();

        return JSON.parse(result) as string[];
    }

    export async function saveGameResults(roomId: string, users: DefaultUserInfo[]) {
        const conn = await Vars.sql.getConnection();
        const results = users.map((user) => {
            return conn.execute<ResultSetHeader>(`UPDATE Users SET score = ? WHERE userId = ?;`, [
                user.score,
                user.userId,
            ]);
        });

        await Promise.all(results); // 모든 업데이트가 완료될 때까지 대기
        conn.release();
        return true;
    }
}
