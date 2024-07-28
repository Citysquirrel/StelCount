import { useEffect, useState } from "react";

export function useExtensionCheck(extensionId: string) {
	const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

	useEffect(() => {
		if (window.chrome && window.chrome.runtime) {
			window.chrome.runtime.sendMessage(extensionId, { message: "is_installed" }, (response) => {
				if (response && response.installed) {
					setIsExtensionInstalled(true);
				}
			});
		}
	}, []);

	return [isExtensionInstalled, setIsExtensionInstalled];
}
