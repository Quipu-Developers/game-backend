interface DefaultGameUserInfo {
    userId: number;
    teamId: number;
    userName: string;
    teamName: string;
    phoneNumber: string;
    score: number;
}

interface RoomGameUserInfo extends DefaultGameUserInfo {
    isAdmin: string;
}

interface DefaultGameTeamInfo {
    teamId: number;
    teamName: string;
    remainingTime: number;
}
