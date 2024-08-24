declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KRDICT_API_KEY: string;
            SQL_HOST: string;
            SQL_USER: string;
            SQL_PASSWD: string;
            SQL_DBNAME: string;
            GOOGLE_AI_API_KEY: string;
        }
    }
}

export {};
