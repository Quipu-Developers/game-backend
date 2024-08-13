import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Vars } from "../Vars";

export namespace GameService {
    export async function getGameEndInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        //deleteManagerInfo();
        const [personalList] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
        const [teamList] = await conn.query<RowDataPacket[]>(`SELECT * FROM Teams ORDER BY remainingTime ASC`);
        conn.release();

        const personalListResult =  personalList.filter((item) => !managerList.includes(item.userName));
        //console.log(teamList);

        const personalIndex = personalListResult.findIndex((item) => item.userId === userId);
        const teamId = personalListResult[personalIndex].teamId;
        const teamIndex = teamList.findIndex((item) => item.teamId === teamId);
        //console.log(teamList[teamIndex].teamName);

        /** 추후에 순위 중복문제 해결 예정 */
        return {
            personalRank: {
                rank: personalIndex + 1,
                userId: userId,
                userName: personalListResult[personalIndex].userName,
                score: personalListResult[personalIndex].score,
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
        //deleteManagerInfo();
        const [personalList] = await conn.query<RowDataPacket[]>("SELECT * FROM Users ORDER BY score DESC;");
        let list = personalList.filter((item) => !managerList.includes(item.userName));
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
    const managerList = ["관리자1", "관리자2", "관리자3"];

    export async function settingManager() {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<RowDataPacket[]>(
            `SELECT EXISTS(SELECT 1 FROM Users WHERE userName IN (?,?,?)) as cnt;`,
            managerList
        );
        
        if(result[0].cnt) {
            // 관리자 정보 삭제
            deleteManagerInfo();
        }
        conn.release();
    }

    export function refreshTeam() {
        currentUsers = [];
        currentTeam = undefined;
    }

    export async function createUser(info: Partial<DefaultGameUserInfo>) {
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

    export async function createTeam(info: Partial<DefaultGameTeamInfo>) {
        const conn = await Vars.sql.getConnection();
        const [result] = await conn.execute<ResultSetHeader>(`INSERT INTO Teams (teamName) VALUES (?);`, [
            info.teamName ?? "no name",
        ]);
        conn.release();
        return { teamId: result.insertId };
    }

    export async function updateTeamInfo(teamId: number, info: Partial<DefaultGameTeamInfo>) {
        const conn = await Vars.sql.getConnection();

        conn.query<RowDataPacket[]>(
            `
                    UPDATE Teams
                    SET ?
                    WHERE teamId = ?;
                `,
            [info, teamId]
        );
        conn.release();
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

    export async function deleteTeamInfo(teamId: number) {
        const conn = await Vars.sql.getConnection();
        conn.query<RowDataPacket[]>(`DELETE FROM Teams WHERE ?;`, [{ teamId }]);
        conn.release();
        return true;
    }

    export async function deleteUserInfo(userId: number) {
        const conn = await Vars.sql.getConnection();
        conn.query<RowDataPacket[]>(`DELETE FROM Users WHERE ?;`, [{ userId }]);
        conn.release();
        return true;
    }

    export async function deleteManagerInfo() {
        const conn = await Vars.sql.getConnection();
        conn.query<RowDataPacket[]>(`DELETE FROM Users WHERE userName In (?);`, managerList);
        conn.release();
        return true;
    }

    export async function existTeam(teamId: number) {
        const conn = await Vars.sql.getConnection();
    }

    export async function existUser(userId: number) {}

    export async function getWords() {
        return ["바나나", "사과나", "딸기야"];
    }
}

export async function getTeamScore(teamId : number) : Promise<number> {

    return 0;
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
