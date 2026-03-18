import {
	AnimatedSpan,
	Terminal,
	TypingAnimation,
} from "components/magicui/terminal";
import { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";
import { useState, useEffect, useMemo, useRef } from "react";
import { GenieEffect } from "components/genie-effect";
import { Dock } from "components/dock";
import { useIsMobile } from "~/hooks/use-is-mobile";

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

	return <span className="mr-2 inline-block w-[1ch]">{frames[index]}</span>;
}

export function Welcome() {
	const options = {
		animationData: animationData,
		loop: true,
		autoplay: true,
	};

	const home = useLottie(options);
	const isMobile = useIsMobile();
	const dockRef = useRef<HTMLDivElement>(null);

	// Toggle between maximised and minimised states
	const [isMaximized, setIsMaximized] = useState(false);

	// Automatically play maximise animation on mount for desktop
	useEffect(() => {
		const timeout = setTimeout(() => setIsMaximized(true), 400);
		return () => clearTimeout(timeout);
	}, []);

	const terminalScript = useMemo(() => {
		const script = [
			{
				text: "➜ ~ npx @devsargam/upload-it@latest file.pdf",
				type: "typed" as const,
				className: "text-white",
			},
			{
				text: "Getting upload URL...",
				type: "spinner" as const,
				className: "text-white",
			},
			{
				text: "Uploading file.pdf...",
				type: "spinner" as const,
				className: "text-white",
			},
			{
				text: "✓ File uploaded successfully",
				type: "static" as const,
				className: "text-white",
			},
			{
				text: "File URL: https://storage.uploadit.app/file.pdf",
				type: "static" as const,
				className: "text-white",
			},
			{
				text: "➜ ~",
				type: "static" as const,
				className: "text-white",
			},
		];

		const CHAR_DURATION = 60;
		const EXTRA_DELAY = 500;
		const SPINNER_DELAY = 1400;
		const STATIC_DELAY = 450;

		let accumulatedDelay = 0;

		return script.map(({ text, type, className }, idx) => {
			const delay = accumulatedDelay;

			switch (type) {
				case "typed":
					accumulatedDelay += text.length * CHAR_DURATION + EXTRA_DELAY;
					return (
						<TypingAnimation key={idx} delay={delay} className={className}>
							{text}
						</TypingAnimation>
					);
				case "spinner":
					accumulatedDelay += SPINNER_DELAY;
					return (
						<AnimatedSpan
							key={idx}
							delay={delay}
							className={`flex items-center ${className ?? ""}`}
						>
							<Spinner />
							{text}
						</AnimatedSpan>
					);
				default:
					accumulatedDelay += STATIC_DELAY;
					return (
						<AnimatedSpan key={idx} delay={delay} className={className}>
							{text}
						</AnimatedSpan>
					);
			}
		});
	}, []);

	return (
		<main className="relative flex flex-col items-center h-screen justify-center sm:pt-16 sm:pb-4 sm:gap-y-5 sm:justify-between overflow-hidden">
			{/* Background image */}
			<div
				className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: "url('/background.jpg')" }}
			/>
			<div className="absolute inset-0 -z-10 bg-black/30" />

			{/* Genie animation wrapper */}
			<GenieEffect
				expanded={isMaximized}
				duration={0.65}
				dockRef={dockRef}
				className="h-screen w-screen sm:h-[500px] sm:w-full sm:max-w-2xl lg:max-w-4xl"
				onClick={isMobile ? undefined : () => setIsMaximized(v => !v)}
			>
				<Terminal className="h-screen w-screen text-sm !max-h-none rounded-none sm:h-[500px] sm:w-full sm:max-w-2xl sm:text-base sm:max-h-[500px] sm:rounded-xl lg:max-w-4xl">
					{terminalScript}
				</Terminal>
			</GenieEffect>

			{/* Dock — ref passed so GenieEffect knows where to animate to */}
			<div ref={dockRef} className="hidden pt-14 sm:block lg:pt-16">
				<Dock />
			</div>
		</main>
	);
}
