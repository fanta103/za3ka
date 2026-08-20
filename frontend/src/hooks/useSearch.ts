import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { IUser, IJob, IPost } from "../types";
import { useEffect, useRef, useState } from "react";

export interface SearchResults {
	users?: IUser[];
	jobs?: IJob[];
	posts?: IPost[];
}

export const useSearch = (query: string, type: "all" | "users" | "jobs" | "posts" = "all") => {
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [query]);

	return useQuery<SearchResults>({
		queryKey: ["search", debouncedQuery, type],
		queryFn: async () => {
			const params = new URLSearchParams({ q: debouncedQuery, type });
			const res = await axiosInstance.get(`/search?${params.toString()}`);
			return res.data;
		},
		enabled: debouncedQuery.trim().length >= 2,
		staleTime: 30 * 1000,
	});
};
