import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { isAdminState } from "../Atom";

export function useConsole(value: any, name: string | undefined = undefined) {
	useEffect(() => {
		if (import.meta.env.DEV)
			if (!name) {
				console.log(value);
			} else console.log({ [name]: value });
	}, [value]);
	return value;
}

export function useConsoleAdmin(value: any, name: string | undefined = undefined) {
	const [isAdmin] = useRecoilState(isAdminState);
	useEffect(() => {
		if (isAdmin)
			if (!name) {
				console.log(value);
			} else console.log({ [name]: value });
	}, [value]);
	return value;
}
