import { useState, useEffect } from "react";
import { getStorageValue, setStorageValue } from "~chrome/storage";

export function useChromeStorage<T>(
    key: string,
    defaultValue: T,
): [T, (value: T) => Promise<void>] {
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        getStorageValue<T>(key).then((val) => {
            if (val !== undefined) {
                setValue(val);
            }
        });
    }, [key]);

    const set = async (newValue: T) => {
        setValue(newValue);

        await setStorageValue(key, newValue);
    };

    return [value, set];
}
