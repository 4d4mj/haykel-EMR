// LoginForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { useFormStatus } from "react-dom"; // Only needed if the action is directly on <form action={...}>
import { loginSchema, LoginSchemaType } from "@/schemas/login"; // Assuming LoginSchemaType is exported
import { loginServerAction } from "./actions"; // Renamed for clarity
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

export function LoginForm({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const form = useForm<LoginSchemaType>({
		// Use the Zod schema type
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const { isSubmitting } = form.formState;

	// This function is called by RHF's handleSubmit only if client-side Zod validation passes.
	const processSubmit = async (data: LoginSchemaType) => {
		const formData = new FormData();
		formData.append("email", data.email);
		formData.append("password", data.password);

		try {
			const result = await loginServerAction(formData); // Call your server action

			if (result?.success) {
				// NextAuth.js signIn with redirectTo usually handles this.
				// If not, or if you want a toast before redirect:
				toast.success(result.message || "Logged in successfully!");
				// router.push("/dashboard"); // Or let NextAuth handle redirect via redirectTo option in signIn
			} else if (result?.errors) {
				// Handle errors returned from the server action
				// You might want to set errors on the form fields if they are field-specific
				// form.setError('email', { type: 'server', message: result.errors.email });
				// For now, using a general toast for server errors
				const errorMessage =
					Object.values(result.errors).join(", ") ||
					"Login failed. Please check your credentials.";
				toast.error(errorMessage);
			} else {
				// Fallback for unexpected server response
				toast.error("An unexpected error occurred on the server.");
			}
		} catch (error) {
			// Catch errors from the server action call itself (e.g., network issues)
			console.error("Form submission error:", error);
			toast.error("Failed to submit the form. Please try again.");
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(processSubmit)} // No second onError needed if Zod handles it
							className="space-y-6"
						>
							{/* Email Field */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												placeholder="m@example.com"
												{...field}
												type="email"
												autoComplete="email"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Password Field */}
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center justify-between">
											<FormLabel>Password</FormLabel>
											<Link
												href="/forgot-password"
												className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
											>
												Forgot your password?
											</Link>
										</div>
										<FormControl>
											<Input
												type="password"
												{...field}
												autoComplete="current-password"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting} // Use RHF's isSubmitting
							>
								{isSubmitting ? "Logging in..." : "Login"}
							</Button>
						</form>
					</Form>
					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{" "}
						<Link
							href="/register"
							className="underline underline-offset-4"
						>
							Register
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
