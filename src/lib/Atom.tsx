import { atom } from "recoil";
import { createAtomKey } from "./functions/createAtomKey";

export const headerOffsetState = atom({
	key: createAtomKey("headerOffset"),
	default: 64,
});
