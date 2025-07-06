"use client";
import {
	AnimatedSpan,
	Terminal,
	TypingAnimation,
} from "components/magicui/terminal";
import Lottie, { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";
import { useState, useEffect, useRef } from "react";
import { GenieEffect } from "components/genie-effect";
import { Dock } from "components/dock";

// Hook to detect if screen is mobile size
function useIsMobile() {
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

// Local rotating spinner for the "Uploading ..." line
function Spinner({ interval = 120 }: { interval?: number }) {
	const frames = ["-", "/", "\\", "|"];
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setIndex(i => (i + 1) % frames.length);
		}, interval);
		return () => clearInterval(id);
	}, [interval, frames.length]);

	return <span className="mr-2">{frames[index]}</span>;
}

export function Welcome() {
	const options = {
		animationData: animationData,
		loop: true,
		autoplay: true,
	};

	const home = useLottie(options);
	const isMobile = useIsMobile();

	// Toggle between maximised and minimised states
	const [isMaximized, setIsMaximized] = useState(true); // Start as true for mobile, will be controlled by useEffect for desktop

	// Automatically play maximise animation on mount for desktop only
	useEffect(() => {
		// Reset to false first, then animate to true for desktop
		setIsMaximized(false);
		const timeout = setTimeout(() => setIsMaximized(true), 200);
		return () => clearTimeout(timeout);
	}, []);

	return (
		<main className="flex flex-col items-center bg-foreground h-screen justify-center sm:pt-16 sm:pb-4 sm:gap-y-5 sm:justify-between">
			{/* Genie animation wrapper */}
			<GenieEffect
				expanded={isMaximized}
				duration={1}
				className="h-screen w-screen sm:h-[500px] sm:w-full sm:max-w-2xl lg:max-w-4xl"
				onClick={isMobile ? undefined : () => setIsMaximized(v => !v)}
			>
				<Terminal className="h-screen w-screen text-sm !max-h-none rounded-none sm:h-[500px] sm:w-full sm:max-w-2xl sm:text-base sm:max-h-[500px] sm:rounded-xl lg:max-w-4xl">
					{(() => {
						// Script defining how each line should appear in the terminal
						const script = [
							{
								text: "➜ ~ npx upload-it@latest file.pdf",
								type: "typed" as const,
							},
							{
								text: "Uploading file.pdf to the cloud...",
								type: "spinner" as const,
							},
							{
								text: "File uploaded successfully to the cloud.",
								type: "static" as const,
							},
							{
								text: "https://www.google.com/file.pdf",
								type: "static" as const,
							},
							{ text: "➜ ~", type: "static" as const },
						];

						// Timing constants (all in ms)
						const CHAR_DURATION = 60; // Matches TypingAnimation default
						const EXTRA_DELAY = 500; // Pause after the typed line completes
						const UPLOAD_DELAY = 2000; // Duration to keep spinner visible before success message
						const STATIC_DELAY = 500; // Pause between static lines

						let accumulatedDelay = 0;

						return script.map(({ text, type }, idx) => {
							const delay = accumulatedDelay;

							let element: React.ReactNode = null;
							switch (type) {
								case "typed":
									element = (
										<TypingAnimation key={idx} delay={delay}>
											{text}
										</TypingAnimation>
									);
									accumulatedDelay += text.length * CHAR_DURATION + EXTRA_DELAY;
									break;
								case "spinner":
									element = (
										<AnimatedSpan
											key={idx}
											delay={delay}
											className="flex items-center"
										>
											<Spinner />
											{text}
										</AnimatedSpan>
									);
									accumulatedDelay += UPLOAD_DELAY;
									break;
								default:
									element = (
										<AnimatedSpan key={idx} delay={delay}>
											{text}
										</AnimatedSpan>
									);
									accumulatedDelay += STATIC_DELAY;
							}

							return element;
						});
					})()}
				</Terminal>
			</GenieEffect>
			<div className="hidden sm:block">
				<Dock />
			</div>
		</main>
	);
}
