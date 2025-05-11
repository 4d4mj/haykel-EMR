// src/schemas/login.ts (or your preferred path)

import { z } from "zod";

export const loginSchema = z
	.object({
		email: z.string().trim().email({ message: "Invalid email address" }),
		password: z
			.string()
			.trim()
			.min(8, { message: "Password must be at least 8 characters long" }) // Added "long" for clarity
			.max(128, {
				message: "Password must be at most 128 characters long", // Added "long" for clarity
			}),
		// You could add a "remember me" checkbox here if needed, e.g.:
		// rememberMe: z.boolean().optional(),
	})
	.strict(); // Ensures no extra fields are allowed beyond email and password

// Infer the TypeScript type from the Zod schema
export type LoginSchemaType = z.infer<typeof loginSchema>;
