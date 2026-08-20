import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IUser } from "../types";

export const useSuggestedUsers = () => {
	return useQuery<IUser[]>({
		queryKey: ["recommendedUsers"],
		queryFn: async () => {
			const res = await axiosInstance.get("/users/suggestions");
			return res.data;
		},
	});
};

export const useUserProfile = (username?: string) => {
	return useQuery<IUser>({
		queryKey: ["userProfile", username],
		queryFn: async () => {
			const res = await axiosInstance.get(`/users/${username}`);
			return res.data;
		},
		enabled: !!username,
	});
};

export const useUpdateProfile = (username?: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (updatedData: Partial<IUser>) => {
			const res = await axiosInstance.put("/users/profile", updatedData);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Profile updated successfully");
			queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to update profile");
		},
	});
};
