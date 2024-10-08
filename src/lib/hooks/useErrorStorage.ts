import { useRecoilState } from "recoil";
import { errorStorageState } from "../Atom";

export function useErrorStorage() {
	const [error, setError] = useRecoilState(errorStorageState);
	const saveErrorMsg = (msg: string) => {
		setError(
			(prev) =>
				`${prev}

${msg}`
		);
	};

	return { error, saveErrorMsg };
}
