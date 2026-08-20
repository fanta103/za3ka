import { mailtrapClient, sender } from "../lib/mailtrap";
import {
	createCommentNotificationEmailTemplate,
	createConnectionAcceptedEmailTemplate,
	createWelcomeEmailTemplate,
	createVerificationEmailTemplate,
	createPasswordResetEmailTemplate,
	createJobApplicationEmailTemplate,
	createApplicationStatusEmailTemplate,
} from "./emailTemplates";

const isMailtrapConfigured = (): boolean => {
	return Boolean(process.env.MAILTRAP_TOKEN);
};

export const sendWelcomeEmail = async (email: string, name: string, profileUrl: string): Promise<void> => {
	const recipient = [{ email }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Welcome email simulated for ${email}`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Welcome to UnLinked",
			html: createWelcomeEmailTemplate(name, profileUrl),
			category: "welcome",
		});
	} catch (error) {
		console.error("Error sending welcome email:", error);
	}
};

export const sendVerificationEmail = async (email: string, name: string, verifyUrl: string): Promise<void> => {
	const recipient = [{ email }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Verification email simulated for ${email} with URL: ${verifyUrl}`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Verify your email address - UnLinked",
			html: createVerificationEmailTemplate(name, verifyUrl),
			category: "email_verification",
		});
	} catch (error) {
		console.error("Error sending verification email:", error);
	}
};

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<void> => {
	const recipient = [{ email }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Password reset email simulated for ${email} with URL: ${resetUrl}`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Reset your UnLinked password",
			html: createPasswordResetEmailTemplate(name, resetUrl),
			category: "password_reset",
		});
	} catch (error) {
		console.error("Error sending password reset email:", error);
	}
};

export const sendCommentNotificationEmail = async (
	recipientEmail: string,
	recipientName: string,
	commenterName: string,
	postUrl: string,
	commentContent: string
): Promise<void> => {
	const recipient = [{ email: recipientEmail }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Comment notification simulated for ${recipientEmail}`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "New Comment on your post",
			html: createCommentNotificationEmailTemplate(recipientName, commenterName, postUrl, commentContent),
			category: "comment_notification",
		});
	} catch (error) {
		console.error("Error sending comment notification email:", error);
	}
};

export const sendConnectionAcceptedEmail = async (
	senderEmail: string,
	senderName: string,
	recipientName: string,
	profileUrl: string
): Promise<void> => {
	const recipient = [{ email: senderEmail }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Connection accepted email simulated for ${senderEmail}`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: `${recipientName} accepted your connection request`,
			html: createConnectionAcceptedEmailTemplate(senderName, recipientName, profileUrl),
			category: "connection_accepted",
		});
	} catch (error) {
		console.error("Error sending connection accepted email:", error);
	}
};

export const sendJobApplicationEmail = async (
	recruiterEmail: string,
	recruiterName: string,
	applicantName: string,
	jobTitle: string,
	jobUrl: string
): Promise<void> => {
	const recipient = [{ email: recruiterEmail }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Job application notification simulated for ${recruiterEmail} (${jobTitle})`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: `New application for ${jobTitle} from ${applicantName}`,
			html: createJobApplicationEmailTemplate(recruiterName, applicantName, jobTitle, jobUrl),
			category: "job_application",
		});
	} catch (error) {
		console.error("Error sending job application email:", error);
	}
};

export const sendApplicationStatusEmail = async (
	applicantEmail: string,
	applicantName: string,
	jobTitle: string,
	companyName: string,
	newStatus: string,
	portalUrl: string
): Promise<void> => {
	const recipient = [{ email: applicantEmail }];
	if (!isMailtrapConfigured()) {
		console.log(`[Mock Email] Application status notification simulated for ${applicantEmail} (${newStatus})`);
		return;
	}

	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: `Status update on your application for ${jobTitle}`,
			html: createApplicationStatusEmailTemplate(applicantName, jobTitle, companyName, newStatus, portalUrl),
			category: "application_status",
		});
	} catch (error) {
		console.error("Error sending application status email:", error);
	}
};

