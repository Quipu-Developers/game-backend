type RequestList = {
    LOGIN: {
        userName: string;
        phoneNumber: string;
    };
    REGISTER: {
        userName: string;
        phoneNumber: string;
    };
    DELETEUSER: {};
    DELETEROOM: {};
    KICKMEMBER: { targetId: number };
    GETROOMS: {};
    STARTGAME: {};
    LEAVEROOM: {};
    JOINROOM: { roomId: string };
    CREATEROOM: { roomName: string };
    CHAT: { message: string };
    WORD: { word: string };
};

type ResponseList = {
    LEAVELOBBY: { userId: number };
    DELETEROOM: { roomId: string };
    JOINLOBBY: { user: DefaultUserInfo };
    STARTGAME: { gameInfo: { words: string[]; isStarted: boolean; users: DefaultUserInfo[] } };
    LEAVEUSER: { user: DefaultUserInfo; roomId: string };
    JOINUSER: { user: DefaultUserInfo; roomId: string };
    CREATEROOM: { room };
    //TODO userName을 userId로 바꾸기
    CHAT: { userName: string; message: string };
    WORD: { userId: number; success: boolean; word: string };
    NEWWORDS: { words: string[] };
    ENDGAME: { users: DefaultUserInfo[] };
};
