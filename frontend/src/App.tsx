import React, { Suspense, lazy } from "react";
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
import ChatPage from "./pages/ChatPage";
import InterviewsPage from "./pages/InterviewsPage";
import { useAuthUser } from "./hooks/useAuth";
import { SocketContextProvider } from "./context/SocketContext";

const InterviewRoomPage = lazy(() => import("./pages/InterviewRoomPage"));

const PageLoader = () => (
    <div className='flex items-center justify-center min-h-[50vh]'>
        <span className='loading loading-spinner loading-lg text-primary' />
    </div>
);

function App() {
    const { data: authUser, isLoading } = useAuthUser();

    return (
        <SocketContextProvider>
            <Routes>
                <Route
                    path='/interviews/:id/room'
                    element={
                        authUser ? (
                            <Suspense fallback={<PageLoader />}>
                                <InterviewRoomPage />
                            </Suspense>
                        ) : (
                            <Navigate to='/login' />
                        )
                    }
                />

                <Route
                    path='*'
                    element={
                        <Layout>
                            {isLoading ? (
                                <div className='flex items-center justify-center min-h-[60vh]'>
                                    <span className='loading loading-spinner loading-lg text-primary' />
                                </div>
                            ) : (
                                <>
                                    <Routes>
                                        <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
                                        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
                                        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
                                        <Route path='/forgot-password' element={!authUser ? <ForgotPasswordPage /> : <Navigate to='/' />} />
                                        <Route path='/reset-password/:token' element={!authUser ? <ResetPasswordPage /> : <Navigate to='/' />} />
                                        <Route path='/notifications' element={authUser ? <NotificationsPage /> : <Navigate to='/login' />} />
                                        <Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to='/login' />} />
                                        <Route path='/jobs' element={authUser ? <JobsPage /> : <Navigate to='/login' />} />
                                        <Route path='/jobs/:id' element={authUser ? <JobDetailPage /> : <Navigate to='/login' />} />
                                        <Route path='/my-jobs' element={authUser ? <MyJobsPage /> : <Navigate to='/login' />} />
                                        <Route path='/my-applications' element={authUser ? <MyApplicationsPage /> : <Navigate to='/login' />} />
                                        <Route path='/chat' element={authUser ? <ChatPage /> : <Navigate to='/login' />} />
                                        <Route path='/interviews' element={authUser ? <InterviewsPage /> : <Navigate to='/login' />} />
                                        <Route path='/post/:postId' element={authUser ? <PostPage /> : <Navigate to='/login' />} />
                                        <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
                                        <Route path='/search' element={authUser ? <SearchPage /> : <Navigate to='/login' />} />
                                    </Routes>
                                    <Toaster />
                                </>
                            )}
                        </Layout>
                    }
                />
            </Routes>
        </SocketContextProvider>
    );
}


export default App;