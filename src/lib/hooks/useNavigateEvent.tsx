import { NavigateOptions, To, useNavigate } from "react-router-dom";

export function useNavigateEvent() {
	const navigate = useNavigate();
	return (to: To, options?: NavigateOptions | undefined) => () => {
		navigate(to, options);
	};
}
