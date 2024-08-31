type SessionPacket = {
    userInfo: Omit<DefaultGameUserInfo, "score">;
};

type GameIdPacket = {
    gameId: string;
};

type LoginPacket = {
    userName: string;
    phoneNumber: string;
};

type DeleteRoomPacket = {
    roomId: string;
    userId: number;
};

type JoinRoomPacket = {
    userId: number;
    roomId: string;
};

type CreateRoomPacket = {
    userId: number;
    roomName: string;
};

type StartGamePacket = {
    userId: number;
    roomId: string;
};

type WordPacket = {
    userId: number;
    roomId: string;
    word: string;
};

type DefaultPacket = SessionPacket & GameIdPacket;

type CreateGamePacket = SessionPacket;

type JoinGamePacket = DefaultPacket;

type ChatPacket = DefaultPacket & {
    roomId: string;
    message: string;
};

type GetRoomsPacket = {
    userId: number;
};
