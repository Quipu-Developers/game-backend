import { Users } from "../model";

export namespace GameService {
    export async function getGameEndInfo(userId: string) {
        const users = await Users.find({}).sort({ score: 1 });

        const user = users.find((user) => user.userId == userId);
        if (!user) return;

        const globalRank = users.findIndex((user) => user.userId == userId);

        return {
            top10GlobalRankings: users.slice(0, 10).map((user) => ({
                userId: user.userId,
                userName: user.userName,
                score: user.score,
            })),
            personalRanking: {
                userId: user.userId,
                userName: user.userName,
                score: user.score,
                globalRank,
            },
        };
    }

    export async function createUser(info: DefaultGameUserInfo) {
        const isExist = await Users.exists({ userId: info.userId });
        if (isExist) return false;
        await Users.create({
            ...info,
            score: 0,
        });
        return true;
    }

    export async function getWords() {
        return ["바나나", "사과나", "딸기야"];
    }
}
