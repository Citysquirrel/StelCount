export function createComponentMap<T>(
	list: T[],
	callback: (data: T, index: number, array: T[]) => JSX.Element,
	emptyComponent?: JSX.Element
) {
	if (list.length > 0) {
		return list.map(callback);
	} else return emptyComponent || null;
}
