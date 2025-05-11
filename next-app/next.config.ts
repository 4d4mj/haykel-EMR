import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	async redirects() {
		return [
			{
				source: "/login", // what the browser asks for
				destination: "/auth/login", // where you really want it
				permanent: false, // 307 redirect
			},
		];
	},
};

export default nextConfig;
