declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KRDICT_API_KEY: string;
        }
    }
}

export {};
