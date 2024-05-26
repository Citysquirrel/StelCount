import { useEffect } from "react";

export function useConsole(value: any, name: string | undefined = undefined) {
	useEffect(() => {
		if (!name) {
			console.log(value);
		} else console.log({ [name]: value });
	}, [value]);
	return value;
}
