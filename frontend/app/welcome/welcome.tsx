import { MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Terminal } from "components/ui/terminal";
import { GenieEffect } from "components/genie-effect";
import { Dock } from "components/dock";
import { MenuBar } from "components/macos/menu-bar";
import { Window } from "components/macos/window";
import type { DesktopActions } from "components/macos/menus";
import { cn } from "~/lib/utils";
import { CopyButton } from "./copy-button";
import { useWindowDrag } from "./use-window-drag";

export const BACKGROUND_URL = "/background.webp";
// Start the intro anyway if the background is slow, so nobody stares at an empty page.
const BACKGROUND_TIMEOUT_MS = 1500;

const INSTALL_COMMAND = "npx @devsargam/upload-it@latest file.pdf";
const GITHUB_URL = "https://github.com/devsargam/upload-it";
// How long a relaunched app bounces in the Dock before its window shows up
const LAUNCH_MS = 900;

const COMMANDS = [
	"npx @devsargam/upload-it@latest report.pdf",
	"npx @devsargam/upload-it@latest send photos.zip",
];

// Mirrors what the CLI really prints
const OUTPUTS: Record<number, string[]> = {
	0: [
		"✔ Getting upload URL...",
		"✔ Uploading file... 100% (2.40 MB / 2.40 MB)",
		"✓ File uploaded successfully!",
		"File URL: https://storage.uploadit.app/report.pdf",
	],
	1: [
		"  Open in a browser:",
		"    https://uploadit.app/r/k7m2xq9p",
		"  Or, with the CLI:",
		"    upload-it receive k7m2xq9p",
		"✔ Sent 100% (48.20 MB / 48.20 MB)",
	],
};

type WindowState = "open" | "minimized" | "closed";

/**
 * Phones get a full-screen terminal with no Dock, so a closed or minimized
 * window would have nowhere to come back from.
 */
function hasDock(): boolean {
	return window.matchMedia("(min-width: 640px)").matches;
}

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
	const desktopRef = useRef<HTMLElement>(null);
	const ghosttyIconRef = useRef<HTMLImageElement>(null);
	const windowRef = useRef<HTMLDivElement>(null);
	const drag = useWindowDrag(windowRef, desktopRef);

	// The window starts in the Dock and genies out once the page is ready
	const [windowState, setWindowState] = useState<WindowState>("minimized");
	const [isZoomed, setIsZoomed] = useState(false);
	// Typing waits for the window to finish opening the first time
	const [hasOpened, setHasOpened] = useState(false);
	// A closed window comes back as a fresh one, so its demo replays
	const [session, setSession] = useState(0);
	// Quitting from the menu stops Ghostty: its Dock dot goes and the next click relaunches it
	const [isRunning, setIsRunning] = useState(true);
	// Clicking the wallpaper hands focus to Finder, as on a real Mac. Like macOS,
	// Ghostty stays frontmost after its window is minimized or closed.
	const [isFocused, setIsFocused] = useState(true);
	const frontApp = isRunning && isFocused ? "Ghostty" : "Finder";
	const isActive = frontApp === "Ghostty" && windowState === "open";

	useEffect(() => {
		let cancelled = false;
		waitForBackground().then(() => {
			if (!cancelled) setWindowState("open");
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const toggleZoom = () => {
		// Zoom fills the desktop, so any drag offset goes away with it
		drag.reset();
		setIsZoomed((zoomed) => !zoomed);
	};

	/** Brings the window back, as a fresh one if it was closed. */
	const showWindow = () => {
		if (windowState === "closed") setSession((s) => s + 1);
		setWindowState("open");
		setIsFocused(true);
	};

	const quit = () => {
		setWindowState("closed");
		setIsZoomed(false);
		drag.reset();
		setIsRunning(false);
	};

	const handleDockClick = (label: string) => {
		if (label !== "Ghostty") return;
		if (isRunning) return showWindow();

		// Relaunch: the icon bounces (the Dock does that), then a new window opens
		setIsRunning(true);
		setIsFocused(true);
		setTimeout(() => {
			setSession((s) => s + 1);
			setWindowState("open");
		}, LAUNCH_MS);
	};

	const actions: DesktopActions = {
		hasWindow: windowState === "open",
		newWindow: showWindow,
		closeWindow: () => setWindowState("closed"),
		minimize: () => setWindowState("minimized"),
		zoom: toggleZoom,
		quit,
		copyCommand: () => navigator.clipboard.writeText(INSTALL_COMMAND),
		openGitHub: () => window.open(GITHUB_URL, "_blank", "noopener"),
	};

	return (
		<MotionConfig reducedMotion="user">
			<div className="relative flex h-dvh cursor-default flex-col overflow-hidden select-none">
				{/* Wallpaper — the fallback colour matches it so loading doesn't flash white */}
				<div
					className="absolute inset-0 -z-10 bg-[#c94b72] bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url('${BACKGROUND_URL}')` }}
				/>

				<div className="hidden sm:block">
					<MenuBar app={frontApp} actions={actions} />
				</div>

				{/* The desktop: everything between the menu bar and the Dock */}
				<main
					ref={desktopRef}
					onPointerDown={(e) => setIsFocused(e.target !== e.currentTarget)}
					className="relative flex flex-1 items-center justify-center sm:p-2 sm:pb-[84px]">
					<GenieEffect
						expanded={windowState !== "minimized"}
						targetRef={ghosttyIconRef}
						onExpandComplete={() => setHasOpened(true)}
						style={{ x: drag.x, y: drag.y }}
						className={cn(
							"h-full w-full transition-[width,height] duration-300 ease-[cubic-bezier(0.645,0.045,0.355,1)]",
							!isZoomed && "sm:h-[min(500px,100%)] sm:w-[min(56rem,100%)]",
						)}
					>
						<motion.div
							ref={windowRef}
							className="h-full"
							initial={false}
							animate={windowState === "closed" ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
						>
							<Window
								title="upload-it — zsh"
								active={isActive}
								accessory={<CopyButton text={INSTALL_COMMAND} />}
								onClose={() => hasDock() && setWindowState("closed")}
								onMinimize={() => hasDock() && setWindowState("minimized")}
								onZoom={toggleZoom}
								onTitleBarPointerDown={drag.startDrag}
							>
								<Terminal
									key={session}
									commands={COMMANDS}
									outputs={OUTPUTS}
									typingSpeed={45}
									delayBetweenCommands={900}
									initialDelay={300}
									autoStart={hasOpened && windowState === "open"}
								/>
							</Window>
						</motion.div>
					</GenieEffect>
				</main>

				<div className="absolute inset-x-0 bottom-1 hidden justify-center sm:flex">
					<Dock
						running={isRunning ? ["Finder", "Ghostty"] : ["Finder"]}
						targetLabel="Ghostty"
						targetRef={ghosttyIconRef}
						onAppClick={handleDockClick}
					/>
				</div>
			</div>
		</MotionConfig>
	);
}
