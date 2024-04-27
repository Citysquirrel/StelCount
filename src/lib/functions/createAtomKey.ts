import { v1 } from "uuid";

export function createAtomKey(keyName: string) {
	return `${keyName}-${v1()}`;
}
