import { RowDataPacket } from "mysql2";
import { Vars } from "../Vars";

export namespace GameService {
    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        const [personalList] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
        const [teamList] = await conn.query<RowDataPacket[]>(`SELECT * FROM Teams ORDER BY remainingTime ASC`);
        conn.release();

        const personalIndex = personalList.findIndex((item) => item.userId === userId);
        const teamId = personalList[personalIndex].teamId;
        const teamIndex = teamList.findIndex((item) => item.teamId === teamId);

        //추후에 순위 중복문제 해결 예정
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

    export async function createUser(info: DefaultGameUserInfo) {
        const conn = await Vars.sql.getConnection();
        conn.query<RowDataPacket[]>(`INSERT Users VALUES (?);`, [
            [info.userId, info.teamId, info.userName, info.teamName, info.phoneNumber, info.score],
        ]);
        conn.query<RowDataPacket[]>(`INSERT Teams VALUES (?);`, [[info.teamId, info.teamName, info.remainingTime]]);
        return true;
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

    export async function getWords() {
        return ["바나나", "사과나", "딸기야"];
    }
}

/**
 createUser = 
{
userId: number, 
teamId: number,
userName: string,
teamName: string,
phoneNumber: string,
Score: number,
isStarted: boolean
}

getGameEndInfo = 
personalRank: 
{
rank: number,
userId: number,
userName: string,
score: number
},
teamRank:
{
rank: number,
teamId: number,
teamName: string,
remainingTime: number
}
 */
