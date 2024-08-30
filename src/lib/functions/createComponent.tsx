import { Text } from "@chakra-ui/react";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export function createComponentMap<T>(
	list: T[],
	callback: (data: T, index: number, array: T[]) => JSX.Element,
	emptyComponent?: JSX.Element
) {
	return (
		<ErrorBoundary fallback={<Text fontSize={"sm"}>컴포넌트 에러</Text>}>
			{list.length > 0 ? list.map(callback) : emptyComponent || null}
		</ErrorBoundary>
	);
}
