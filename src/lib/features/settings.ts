export type StoredSettings = {
    blurValue: number;
    scaleValue: number;
    filteringMode: string;
    aspectRatio: string;
};

export const SETTINGS_STORAGE_KEY = "image-fixr-settings";
export const DARK_MODE_STORAGE_KEY = "image-fixr-dark-mode";
export const SETTINGS_CHANNEL_NAME = "image-fixr-settings-channel";

export const DEFAULT_SETTINGS: StoredSettings = {
    blurValue: 0,
    scaleValue: 1,
    filteringMode: "linear",
    aspectRatio: "16:9",
};

export function getStoredSettings(): StoredSettings {
    try {
        const stored = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
        return stored
            ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
            : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function getStoredDarkMode(): boolean {
    return localStorage.getItem(DARK_MODE_STORAGE_KEY) === "true";
}

export function normalizeSharedSettings(
    value: unknown,
    current: StoredSettings,
): StoredSettings {
    if (!value || typeof value !== "object") return current;

    const incoming = value as Partial<StoredSettings>;

    return {
        blurValue:
            typeof incoming.blurValue === "number"
                ? incoming.blurValue
                : current.blurValue,
        scaleValue:
            typeof incoming.scaleValue === "number"
                ? incoming.scaleValue
                : current.scaleValue,
        filteringMode:
            typeof incoming.filteringMode === "string"
                ? incoming.filteringMode
                : current.filteringMode,
        aspectRatio:
            typeof incoming.aspectRatio === "string"
                ? incoming.aspectRatio
                : current.aspectRatio,
    };
}
