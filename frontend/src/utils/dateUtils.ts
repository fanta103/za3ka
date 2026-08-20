import { format, parseISO, isValid } from "date-fns";

export const formatDate = (dateString?: string): string => {
	if (!dateString) return "Present";
	const date = parseISO(dateString);
	return isValid(date) ? format(date, "MMM yyyy") : "Present";
};
