import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IUser } from "../types";
import { useNavigate } from "react-router-dom";

export const useAuthUser = () => {
	return useQuery<IUser>({
		queryKey: ["authUser"],
		queryFn: async () => {
			const res = await axiosInstance.get("/auth/me");
			return res.data;
		},
		retry: false,
		staleTime: 30 * 1000, // 30 seconds
	});
};

export const useLogin = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (credentials: { username: string; password: string }) => {
			const res = await axiosInstance.post("/auth/login", credentials);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || err.response?.data?.error?.message || "Login failed");
		},
	});
};

export const useSignUp = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			name: string;
			username: string;
			email: string;
			password: string;
			role?: string;
		}) => {
			const res = await axiosInstance.post("/auth/signup", data);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || err.response?.data?.error?.message || "Sign up failed");
		},
	});
};


export const useLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.post("/auth/logout");
            return res.data;
        },
        onSuccess: () => {
            queryClient.clear();
            window.location.href = "/login";
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Logout failed");
        },
    });
};

export const useForgotPassword = () => {
	return useMutation({
		mutationFn: async (email: string) => {
			const res = await axiosInstance.post("/auth/forgot-password", { email });
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data.message || "Password reset instructions sent.");
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to send reset email");
		},
	});
};

export const useResetPassword = () => {
	return useMutation({
		mutationFn: async ({ token, password }: { token: string; password: string }) => {
			const res = await axiosInstance.post("/auth/reset-password", { token, password });
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data.message || "Password reset successfully. Please log in.");
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to reset password");
		},
	});
};

export const useResendVerification = () => {
	return useMutation({
		mutationFn: async (email: string) => {
			const res = await axiosInstance.post("/auth/resend-verification", { email });
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data.message || "Verification email sent.");
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to resend verification email");
		},
	});
};
