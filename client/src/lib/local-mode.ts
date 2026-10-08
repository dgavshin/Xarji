export const LOCAL_ONLY = import.meta.env.VITE_XARJI_LOCAL_ONLY === "true";

/** Browser UUIDs work for both the local store and InstantDB entity ids. */
export function id(): string { return crypto.randomUUID(); }
