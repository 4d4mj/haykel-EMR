// ./actions.ts (or your preferred location for server actions)
"use server";

import { signIn } from "@/lib/auth"; // Your NextAuth.js v5 signIn
import { AuthError } from "next-auth"; // Specific error from NextAuth.js
import { loginSchema } from "@/schemas/login"; // For server-side validation (optional but good)

interface ActionResult {
    success?: boolean;
    message?: string;
    errors?: { // Allow for general errors or field-specific errors
        general?: string;
        email?: string;
        password?: string;
        [key: string]: string | undefined; // Allow other field errors
    };
}

export async function loginServerAction(formData: FormData): Promise<ActionResult> {
    const rawFormData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    // Optional: Server-side validation with Zod (recommended as a second layer)
    const validatedFields = loginSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
        // console.log("Server-side validation failed:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors as ActionResult["errors"],
            message: "Invalid fields provided."
        };
    }

    const { email, password } = validatedFields.data;

    try {
        // Call NextAuth.js signIn for the "credentials" provider
        // The `authorize` function in your auth.ts will be executed.
        // `redirectTo` is crucial for NextAuth to handle the redirect on success.
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard", // Or your desired redirect path
        });

        // IMPORTANT: If signIn is successful and redirectTo is set,
        // NextAuth.js will throw a NEXT_REDIRECT error to perform the redirect.
        // This means the code below this `await signIn` might not execute in the success case.
        // This is expected behavior.
        // If you wanted to return a success message *before* redirect (less common for login):
        // you could use `redirect: false` in signIn and handle redirection manually.
        return { success: true, message: "Logged in successfully! Redirecting..." };

    } catch (error) {
        if (error instanceof AuthError) {
            // Handle specific NextAuth.js errors
            // console.error("NextAuth Error during sign-in:", error.type, error.cause);
            switch (error.type) {
                case "CredentialsSignin": // This is a common error type for invalid credentials
                    return { errors: { general: "Invalid email or password." } };
                case "CallbackRouteError": // Error during the callback phase
                     return { errors: { general: `Login error: ${error.cause?.err?.message || 'Callback failed'}` } };
                default:
                    return { errors: { general: "An unexpected authentication error occurred." } };
            }
        }
        // For other non-AuthError types (should be rare if signIn is the main thing here)
        console.error("Generic Error in loginServerAction:", error);
        // You might not want to expose generic error messages directly to the client.
        return { errors: { general: "An unexpected error occurred during login." } };
    }
}
