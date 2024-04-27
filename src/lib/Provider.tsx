import React from "react";
import { RecoilRoot } from "recoil";

export function MainProvider({ children }) {
	return (
		<React.StrictMode>
			<RecoilRoot>{children}</RecoilRoot>
		</React.StrictMode>
	);
}
