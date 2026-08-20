import React from "react";
import { useParams } from "react-router-dom";
import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import { IUser } from "../types";
import { useAuthUser } from "../hooks/useAuth";
import { useUserProfile, useUpdateProfile } from "../hooks/useUser";

const ProfilePage: React.FC = () => {
	const { username } = useParams<{ username: string }>();

	const { data: authUser, isLoading } = useAuthUser();
	const { data: userProfile, isLoading: isUserProfileLoading } = useUserProfile(username);
	const { mutate: updateProfile } = useUpdateProfile(username);

	if (isLoading || isUserProfileLoading) return null;
	if (!userProfile && !authUser) return null;

	const isOwnProfile = authUser?.username === (userProfile?.username || username);
	const userData = isOwnProfile && authUser ? authUser : userProfile;

	if (!userData) return null;

	const handleSave = (updatedData: Partial<IUser>) => {
		updateProfile(updatedData);
	};

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
		</div>
	);
};

export default ProfilePage;
