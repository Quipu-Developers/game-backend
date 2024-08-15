interface DefaultGameUserInfo {
    userId: number;
    teamId: number;
    userName: string;
    teamName: string;
    phoneNumber: string;
    score: number;
}

interface RoomGameUserInfo implements DefaultGameTeamInfo {

}

interface DefaultGameTeamInfo {
    teamId: number;
    teamName: string;
    remainingTime: number;
}

