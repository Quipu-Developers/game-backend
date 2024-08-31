interface DefaultUserInfo {
    userId: number;
    score: number;
    userName: string;
    phoneNumber: string;
}

interface LobbyUserInfo extends DefaultUserInfo {
    roomId?: string;
}

type RoomPower = "leader" | "normal";

interface RoomUserInfo extends LobbyUserInfo {
    power: RoomPower;
}
