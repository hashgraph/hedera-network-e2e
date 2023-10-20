import { NetworkType } from "./NetworkType";

export interface CLIOptions {
    accounts: number,
    async: boolean,
    balance: number,
    host: string,
    network: NetworkType,
    limits: boolean,
    devMode: boolean,
    fullMode: boolean,
    multiNode: boolean,
    userCompose: boolean,
    userComposeDir: string,
    blocklisting: boolean
}