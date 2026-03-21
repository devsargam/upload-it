import { Terminal } from "components/ui/terminal";
import { useLottie } from "lottie-react";
import animationData from "~/welcome/upload.json";
import { useState, useEffect, useRef } from "react";
import { GenieEffect } from "components/genie-effect";
import { Dock } from "components/dock";
import { useIsMobile } from "~/hooks/use-is-mobile";

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

	const commands = [
		"npx @devsargam/upload-it@latest file.pdf",
	];

	const outputs: Record<number, string[]> = {
		0: [
			"Getting upload URL...",
			"Uploading file.pdf...",
			"✓ File uploaded successfully",
			"File URL: https://storage.uploadit.app/file.pdf",
		],
	};

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
			>
				<Terminal
					commands={commands}
					outputs={outputs}
					username="upload-it"
					className="h-full w-full !max-w-none [&>div]:h-full [&>div]:max-h-none [&>div]:rounded-none sm:[&>div]:rounded-xl"
					typingSpeed={50}
					delayBetweenCommands={800}
					initialDelay={500}
					enableSound={true}
					onMinimize={() => setIsMaximized(false)}
				/>
			</GenieEffect>

			{/* Dock — ref passed so GenieEffect knows where to animate to */}
			<div ref={dockRef} className="hidden pt-14 sm:block lg:pt-16">
				<Dock onAppClick={(label) => {
				if (label === "Ghostty") setIsMaximized(true);
			}} />
			</div>
		</main>
	);
}
