import { useState, useEffect } from "react";

/**
 * Hook to detect if the current screen size is mobile (< 640px)
 * Uses the same breakpoint as Tailwind's 'sm' breakpoint for consistency
 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 640); // sm breakpoint
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);
		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	return isMobile;
}
