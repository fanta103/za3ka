import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "LinkedIn Clone & Job Platform SaaS API",
			version: "1.0.0",
			description:
				"Production-ready REST API for LinkedIn Clone and Job Platform SaaS with authentication, jobs, applications, chat, video interviews, and social feed.",
		},
		servers: [
			{
				url: "/api/v1",
				description: "API v1 Endpoint",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "jwt-linkedin",
				},
			},
		},
		security: [
			{
				cookieAuth: [],
			},
		],
	},
	apis: ["./backend/routes/*.ts", "./backend/controllers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
	app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	app.get("/api/docs.json", (_req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.send(swaggerSpec);
	});
};
