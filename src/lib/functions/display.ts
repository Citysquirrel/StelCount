export function displayPriority(priority: number | null) {
	if (!priority) return "";
	return priority === 7 ? "⭐" : priority;
}
