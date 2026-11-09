/* eslint-disable react-refresh/only-export-components */
import { Flex, Portal, Spinner, Text } from "@chakra-ui/react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useId, useState } from "react";

const LoadingContext = createContext<((id: string, message?: string) => void) | null>(null);

export function AdminLoadingPopup({ message = "데이터를 불러오는 중입니다." }: { message?: string }) {
	return (
		<Portal>
			<Flex role="status" aria-live="polite" aria-atomic="true" position="fixed"
				top="calc(16px + env(safe-area-inset-top, 0px))" left="50%" transform="translateX(-50%)"
				zIndex="toast" pointerEvents="none" maxW="calc(100vw - 32px)" w="max-content"
				align="center" gap={3} px={5} py={3} bg="#211a30" color="#f1edf8"
				border="1px solid #645078" rounded="xl" shadow="lg">
				<Spinner size="sm" color="#c1a4ef" flexShrink={0} />
				<Text fontSize="sm">{message}</Text>
			</Flex>
		</Portal>
	);
}

export function AdminLoadingProvider({ children }: PropsWithChildren) {
	const [messages, setMessages] = useState<Record<string, string>>({});
	const fetching = useIsFetching({ predicate: (query) => query.queryKey[0] === "admin" && query.getObserversCount() > 0 });
	const mutating = useIsMutating();
	const report = useCallback((id: string, message?: string) => {
		setMessages((previous) => {
			if (previous[id] === message) return previous;
			const next = { ...previous };
			if (message) next[id] = message;
			else delete next[id];
			return next;
		});
	}, []);
	const message = Object.values(messages).at(-1) || (mutating ? "변경사항을 처리하는 중입니다." : fetching ? "데이터를 불러오는 중입니다." : undefined);
	return (
		<LoadingContext.Provider value={report}>
			{children}
			{message && <AdminLoadingPopup message={message} />}
		</LoadingContext.Provider>
	);
}

export function useAdminLoading(loading: boolean, message: string) {
	const report = useContext(LoadingContext);
	const id = useId();
	useEffect(() => {
		report?.(id, loading ? message : undefined);
		return () => report?.(id);
	}, [report, id, loading, message]);
}

export function AdminPageLoading() {
	useAdminLoading(true, "페이지를 불러오는 중입니다.");
	return null;
}
