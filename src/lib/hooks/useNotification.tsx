import { useCallback, useEffect, useState } from "react";

export function useNotification() {
	const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

	// 알림 권한 요청
	const requestPermission = useCallback(() => {
		if (!("Notification" in window)) {
			alert("이 브라우저는 알림을 지원하지 않습니다.");
			return;
		}

		if (Notification.permission === "default") {
			Notification.requestPermission().then((result) => {
				setPermission(result);
				if (result === "granted") {
					notify("알림 권한이 허용되었습니다.");
				} else if (result === "denied") {
					alert("브라우저 설정에서 알림 권한을 허용해 주세요.");
				}
			});
		} else if (Notification.permission === "denied") {
			alert("브라우저 설정에서 알림 권한을 허용해 주세요.");
		} else {
			notify("이미 알림 권한이 허용되어 있습니다.");
		}
	}, []);

	// 알림 표시 함수
	const notify = useCallback((title: string, options?: NotificationOptions) => {
		if (!("Notification" in window)) {
			console.warn("Notification API is not supported.");
			return;
		}

		if (Notification.permission === "granted") {
			const notification = new Notification(title, options);

			// 예시 클릭 핸들러
			notification.onclick = (e) => {
				e.preventDefault();
				window.focus();
			};
		}
	}, []);

	// 권한 상태 초기화
	useEffect(() => {
		setPermission(Notification.permission);
	}, []);

	return {
		permission,
		requestPermission,
		notify,
	};
}
