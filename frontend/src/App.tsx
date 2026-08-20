import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NotificationsPage from "./pages/NotificationsPage";
import NetworkPage from "./pages/NetworkPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import MyJobsPage from "./pages/MyJobsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import { useAuthUser } from "./hooks/useAuth";

function App() {
	const { data: authUser, isLoading } = useAuthUser();

	if (isLoading) return null;

	return (
		<Layout>
			<Routes>
				<Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />} />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
				<Route path='/forgot-password' element={!authUser ? <ForgotPasswordPage /> : <Navigate to={"/"} />} />
				<Route path='/reset-password/:token' element={!authUser ? <ResetPasswordPage /> : <Navigate to={"/"} />} />
				<Route
					path='/notifications'
					element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />}
				/>
				<Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />} />
				<Route path='/jobs' element={authUser ? <JobsPage /> : <Navigate to={"/login"} />} />
				<Route path='/jobs/:id' element={authUser ? <JobDetailPage /> : <Navigate to={"/login"} />} />
				<Route path='/my-jobs' element={authUser ? <MyJobsPage /> : <Navigate to={"/login"} />} />
				<Route
					path='/my-applications'
					element={authUser ? <MyApplicationsPage /> : <Navigate to={"/login"} />}
				/>
				<Route path='/post/:postId' element={authUser ? <PostPage /> : <Navigate to={"/login"} />} />
				<Route
					path='/profile/:username'
					element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
				/>
				<Route path='/search' element={authUser ? <SearchPage /> : <Navigate to={"/login"} />} />
			</Routes>
			<Toaster />
		</Layout>
	);
}

export default App;

