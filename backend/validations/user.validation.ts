import { z } from "zod";

export const experienceSchema = z.object({
	_id: z.string().optional(),
	title: z.string().optional(),
	company: z.string().optional(),
	startDate: z.string().or(z.date()).optional(),
	endDate: z.string().or(z.date()).optional().nullable(),
	description: z.string().optional(),
});

export const educationSchema = z.object({
	_id: z.string().optional(),
	school: z.string().optional(),
	fieldOfStudy: z.string().optional(),
	startYear: z.number().optional().nullable(),
	endYear: z.number().optional().nullable(),
});

export const updateProfileSchema = z.object({
	name: z.string().min(1, "Name cannot be empty").optional(),
	headline: z.string().max(200, "Headline too long").optional(),
	location: z.string().max(100, "Location too long").optional(),
	about: z.string().max(2000, "About section too long").optional(),
	profilePicture: z.string().optional(),
	bannerImg: z.string().optional(),
	skills: z.array(z.string()).optional(),
	experience: z.array(experienceSchema).optional(),
	education: z.array(educationSchema).optional(),
});

export const usernameParamSchema = z.object({
	username: z.string().min(1, "Username is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
