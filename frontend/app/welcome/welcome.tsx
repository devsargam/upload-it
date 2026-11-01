import { Terminal } from "components/ui/terminal";
import { useState, useEffect, useRef } from "react";
import { GenieEffect } from "components/genie-effect";
import { Dock } from "components/dock";

export const BACKGROUND_URL = "/background.webp";
// Start the intro anyway if the background is slow, so nobody stares at an empty page.
const BACKGROUND_TIMEOUT_MS = 1500;

/**
 * Resolves once the background is decoded, so the intro plays on a quiet
 * main thread instead of competing with image decoding.
 */
function waitForBackground(): Promise<void> {
	const image = new Image();
	image.src = BACKGROUND_URL;
	const timeout = new Promise<void>((res) => setTimeout(res, BACKGROUND_TIMEOUT_MS));
	return Promise.race([image.decode().catch(() => {}), timeout]);
}

export function Welcome() {
	const dockRef = useRef<HTMLDivElement>(null);

	// Toggle between maximised and minimised states
	const [isMaximized, setIsMaximized] = useState(false);
	// Typing waits for the window to finish opening the first time
	const [hasOpened, setHasOpened] = useState(false);

	useEffect(() => {
		let cancelled = false;
		waitForBackground().then(() => {
			if (!cancelled) setIsMaximized(true);
		});
		return () => {
			cancelled = true;
		};
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
		<main className="relative flex flex-col items-center h-dvh justify-center sm:pt-16 sm:pb-4 sm:gap-y-5 sm:justify-between overflow-hidden">
			{/* Background image — the fallback colour matches it so loading doesn't flash white */}
			<div
				className="absolute inset-0 -z-10 bg-[#c94b72] bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url('${BACKGROUND_URL}')` }}
			/>
			<div className="absolute inset-0 -z-10 bg-black/30" />

			{/* Genie animation wrapper */}
			<GenieEffect
				expanded={isMaximized}
				duration={0.65}
				dockRef={dockRef}
				onExpandComplete={() => setHasOpened(true)}
				className="h-dvh w-screen sm:h-[500px] sm:w-full sm:max-w-2xl lg:max-w-4xl"
			>
				<Terminal
					commands={commands}
					outputs={outputs}
					username="upload-it"
					className="h-full w-full !max-w-none [&>div]:h-full [&>div]:max-h-none [&>div]:rounded-none sm:[&>div]:rounded-xl"
					typingSpeed={50}
					delayBetweenCommands={800}
					initialDelay={200}
					autoStart={hasOpened}
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
