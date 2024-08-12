type SessionPacket = {
    userInfo: Omit<DefaultGameUserInfo, "score">;
};

type GameIdPacket = {
    gameId: string;
};

type DefaultPacket = SessionPacket & GameIdPacket;

type CreateGamePacket = SessionPacket;

type JoinGamePacket = DefaultPacket;

type ChangeTeamNamePacket = DefaultPacket & {
    teamName: string;
};

type StartGamePacket = DefaultPacket;

type WordPacket = DefaultPacket & {
    word: string;
};

type ChatPacket = DefaultPacket & {
    message: string;
};
