import { useEffect, useState } from "react";

export function useExtensionCheck(extensionId: string, correctVersion: string) {
	const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
	const [version, setVersion] = useState("");
	const [isLatestVersion, setIsLatestVersion] = useState(false);

	useEffect(() => {
		if (window.chrome && window.chrome.runtime) {
			window.chrome.runtime.sendMessage(extensionId, { message: "isInstalled" }, (res) => {
				if (res && res.installed) {
					setIsExtensionInstalled(true);
					console.log("installed");
				}
			});
			window.chrome.runtime.sendMessage(extensionId, { message: "versionInfo" }, (res) => {
				if (res && res.version) {
					setVersion(res.version);
					if (res.version === correctVersion) setIsLatestVersion(true);
					else setIsLatestVersion(false);
				}
			});
		}
	}, []);

	return { isExtensionInstalled, version, isLatestVersion };
}
