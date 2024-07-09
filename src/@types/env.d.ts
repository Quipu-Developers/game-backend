declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KRDICT_API_KEY: string;
            MONGO_DBNAME: string;
            MONGO_DBURL: string;
        }
    }
}

export {};
