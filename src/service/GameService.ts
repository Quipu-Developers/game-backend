import { Vars } from "../Vars";
import { GameWords } from "../constants";
import { ChatSession, GoogleGenerativeAI } from "@google/generative-ai";

const configuration = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const modelGemini = configuration.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const functionDeclarations: any = [
    {
        name: "get_words",
        description: "단어를 가져오라하면 호출해야 하는 함수 words에 무작위 한국어 단어 여러개를 넣어서 보내면 된다.",
        parameters: {
            type: "OBJECT",
            description: `단어 여러개`,
            properties: {
                words: {
                    type: "ARRAY",
                    description: "단어 여러개",
                    items: {
                        description: "단어 여러개",
                        type: "STRING",
                    },
                },
            },
            required: ["words"],
        },
    },
];

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

let chat: ChatSession = modelGemini.startChat({
    history: [],
    generationConfig: {
        ...generationConfig,
        maxOutputTokens: 4000,
    },
    tools: [
        {
            functionDeclarations,
        },
    ],
});

async function getWords(): Promise<string[]> {
    const result = await chat.sendMessage("단어 84개를 가져와줘");

    const response = result.response;
    const functions = result.response.functionCalls();

    console.log(response.text());

    if (functions && functions[0].name == "get_words") {
        console.log(functions[0]);
        return (functions[0].args as any).words;
    }

    return [];
}

(async () => {
    const words = await getWords();
    console.log(words);
})();

export class Game {
    public users: DefaultGameUserInfo[] = [];
    public words: string[] = GameWords;
    public isStarted = false;
    public startTime?: number;
    public timer?: NodeJS.Timeout;

    constructor(public roomId: string) {}

    public getGameInfo() {
        return {
            words: this.words,
            isStarted: this.isStarted,
            users: this.users,
        };
    }

    public getUser(userId: number) {
        return this.users.find((user) => user.userId == userId);
    }

    public addUser(user: DefaultGameUserInfo) {
        this.users.push(user);
    }

    public removeUser(user: DefaultGameUserInfo) {
        this.users.splice(this.users.indexOf(user), 1);
    }

    public async word(userId: number, word: string) {
        const user = this.getUser(userId);
        if (!user) return false;

        const deleted = this.words.splice(this.words.indexOf(word), 1);
        if (deleted.length == 0) return false;

        user.score += 10;

        if (this.words.length == 0) {
            this.words = await getWords();
            Vars.io.to(this.roomId.toString()).emit("NEWWORDS", { words: this.words });
        }

        return true;
    }

    public async startGame() {
        this.isStarted = true;
        this.startTime = Date.now();

        Vars.io.to(this.roomId.toString()).emit("STARTGAME", { gameInfo: this.getGameInfo() });
    }

    public async endGame() {
        if (!this.startTime) throw new Error("can't end game without startTime");

        clearTimeout(this.timer);

        Vars.io.to(this.roomId).emit("ENDGAME", { users: this.users });
        const sockets = await Vars.io.sockets.in(this.roomId).fetchSockets();

        for (const socket of sockets) {
            socket.leave(this.roomId);
        }
    }
}
