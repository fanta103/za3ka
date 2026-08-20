import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN;

export const mailtrapClient: any = TOKEN
	? new MailtrapClient({ token: TOKEN })
	: { send: async () => ({}) };

export const sender = {
	email: process.env.EMAIL_FROM || "mailtrap@demomailtrap.com",
	name: process.env.EMAIL_FROM_NAME || "LinkedIn Clone",
};
