import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Vars } from "./../Vars";
import _ from "lodash";

export namespace DatabaseService {
    const userTableName = process.env.PRODUCTION == "dev" ? "Test_Users" : "Users";

    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>(
            `SELECT * FROM ${userTableName} WHERE userName NOT IN ('관리자1', '관리자2', '관리자3') ORDER BY score DESC;`
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
            top10: _.chain(personalList)
                .groupBy("score")
                .toArray()
                .reverse()
                .map((group, rank) =>
                    group.map((user) => {
                        user.rank = +rank + 1;
                        return user;
                    })
                )
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

    export async function getWords(num: number) {
        async function load() {
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
                        parts: [
                            {
                                text: `글자 세 개로 이루어진 한글 단어이어야해. (예를 들어 "자전거"가 적절한 예시임.) ("빵" "술" "밥" 등의 한글자 단어나 "오토바이" 같은 4글자 단어는 안됨)`,
                            },
                        ],
                    },
                    {
                        role: "model",
                        parts: [
                            {
                                text: "넵 알겠습니다. 세 글자로 된 단어를 몇개 만들어드릴까요?",
                            },
                        ],
                    },
                ],
            });

            const result: string = (
                await chat.sendMessage(`위 조건을 만족시키는 세 글자 단어 ${num}개를 json 형식으로 출력해줘`)
            ).response.text();

            return (JSON.parse(result) as string[]).filter((word) => word.length <= 3);
        }

        const words = new Set<string>();

        while (words.size < num) {
            (await load()).forEach((word) => words.add(word));
        }

        return Array.from(words).slice(0, num);
    }
}
