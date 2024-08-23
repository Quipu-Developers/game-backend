import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Vars } from "src/Vars";

export namespace DatabaseService {
    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
        const [teamList] = await conn.query<RowDataPacket[]>(`SELECT * FROM Teams ORDER BY remainingTime ASC`);
        conn.release();

        const personalIndex = personalList.findIndex((item) => item.userId === userId);
        const teamId = personalList[personalIndex].teamId;
        const teamIndex = teamList.findIndex((item) => item.teamId === teamId);

        /** 추후에 순위 중복문제 해결 예정 */
        return {
            personalRank: {
                rank: personalIndex + 1,
                userId: userId,
                userName: personalList[personalIndex].userName,
                score: personalList[personalIndex].score,
            },
            teamRank: {
                rank: teamIndex + 1,
                teamId: teamId,
                teamName: teamList[teamIndex].teamName,
                remainingTime: teamList[teamIndex].remainingTime,
            },
        };
    }

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

    let currentUsers = [];
    let currentTeam: number | undefined;

    export function refreshTeam() {
        currentUsers = [];
        currentTeam = undefined;
    }

    export async function createUser(info: { userName: string; phoneNumber: string }) {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO Users (userName, phoneNumber) VALUES (?, ?);`,
            [info.userName, info.phoneNumber]
        );
        conn.release();

        const userId = result.insertId;

        currentUsers.push(userId);

        return { userId };
    }

    export async function updateUserInfo(userId: number, info: Partial<DefaultGameUserInfo>) {
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
}
