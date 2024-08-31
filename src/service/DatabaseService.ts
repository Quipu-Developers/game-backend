import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Vars } from "./../Vars";

export namespace DatabaseService {
    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM Users WHERE userName NOT IN ('관리자1', '관리자2', '관리자3') ORDER BY score DESC;"
        );

        //"SELECT * FROM Users where userName not in ((?)) ORDER BY score DESC;"
        //const [teamList] = await conn.query<RowDataPacket[]>(`SELECT * FROM Teams ORDER BY remainingTime ASC`);
        conn.release();
        console.log(personalList);
        const personalIndex = personalList.findIndex((item) => item.userId === userId);
        const teamId = personalList[personalIndex].teamId;

        //const teamIndex = teamList.findIndex((item) => item.teamId === teamId);

        /** 추후에 순위 중복문제 해결 예정 */
        return {
            personalRank: {
                rank: personalIndex + 1,
                userId: userId,
                userName: personalList[personalIndex].userName,
                score: personalList[personalIndex].score,
            },
            top10: personalList.splice(0, 10),
        };
    }

    const manager = ["관리자1", "관리자2", "관리자3"];

    export async function getGameEndInfoRanks(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [list] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
        conn.release();

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
}
