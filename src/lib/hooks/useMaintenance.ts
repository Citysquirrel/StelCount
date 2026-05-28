import { useRecoilState } from "recoil";
import { isMaintenanceState } from "../Atom";
import { useEffect } from "react";
import { fetchServer } from "../functions/fetch";

export function useMaintenance() {
	const [isMaintenance, setIsMaintenance] = useRecoilState(isMaintenanceState);

	useEffect(() => {
		fetchServer("v2", "/maintenance")
			.then((res) => {
				console.log(res.data);
			})
			.catch((error) => {
				setIsMaintenance(false);
			});
	}, []);
	return { isMaintenance };
}
