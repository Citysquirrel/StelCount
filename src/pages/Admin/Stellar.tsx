import { useEffect } from "react";
import { fetchServer } from "../../lib/functions/fetch";

export function Stellar() {
	useEffect(() => {
		fetchServer("v1", "/stellars").then(() => {});
		fetchServer("v1", "/tags").then(() => {});
	}, []);
	return <></>;
}
