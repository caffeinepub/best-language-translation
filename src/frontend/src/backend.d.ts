import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Record_ {
    id: bigint;
    sourceLang: string;
    sourceText: string;
    translatedText: string;
    targetLang: string;
    timestampNanos: bigint;
}
export interface backendInterface {
    clearHistory(): Promise<void>;
    deleteRecord(id: bigint): Promise<void>;
    getAllHistory(): Promise<Array<Record_>>;
    saveTranslation(sourceText: string, sourceLang: string, targetLang: string, translatedText: string): Promise<void>;
}
