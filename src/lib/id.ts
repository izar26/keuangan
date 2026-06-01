import * as Crypto from "expo-crypto";

export function createLocalId(prefix: string) {
  const uuid = Crypto.randomUUID();

  return `${prefix}-${uuid}`;
}
