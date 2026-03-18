"use client";

import { cn } from "~/lib/utils";
import { motion, type MotionProps } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { X, Minus, Maximize2 } from "lucide-react";

interface AnimatedSpanProps extends MotionProps {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}

export const AnimatedSpan = ({
	children,
	delay = 0,
	className,
	...props
}: AnimatedSpanProps) => (
	<motion.div
		initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
		animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
		transition={{
			duration: 0.4,
			delay: delay / 1000,
			ease: [0.25, 0.1, 0.25, 1],
		}}
		className={cn("grid text-sm font-normal tracking-tight", className)}
		{...props}
	>
		{children}
	</motion.div>
);

interface TypingAnimationProps {
	children: string;
	className?: string;
	duration?: number;
	delay?: number;
}

export const TypingAnimation = ({
	children,
	className,
	duration = 60,
	delay = 0,
}: TypingAnimationProps) => {
	if (typeof children !== "string") {
		throw new Error("TypingAnimation: children must be a string.");
	}

	const [displayedText, setDisplayedText] = useState<string>("");
	const hasStarted = useRef(false);

	useEffect(() => {
		// Only run once — prevents re-triggers from parent re-renders
		if (hasStarted.current) return;
		hasStarted.current = true;

		let i = 0;
		let typingEffect: ReturnType<typeof setInterval> | null = null;

		const startTimeout = setTimeout(() => {
			typingEffect = setInterval(() => {
				i += 1;
				setDisplayedText(children.slice(0, i));
				if (i >= children.length && typingEffect) {
					clearInterval(typingEffect);
				}
			}, duration);
		}, delay);

		return () => {
			clearTimeout(startTimeout);
			if (typingEffect) clearInterval(typingEffect);
		};
	}, [children, delay, duration]);

	return (
		<span className={cn("text-sm font-normal tracking-tight", className)}>
			{displayedText}
		</span>
	);
};

interface TerminalProps {
	children: React.ReactNode;
	className?: string;
	onClose?: () => void;
	onMinimize?: () => void;
	onMaximize?: () => void;
}

export const Terminal = ({
	children,
	className,
	onClose,
	onMinimize,
	onMaximize,
}: TerminalProps) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className={cn(
				"z-0 h-full w-full rounded-xl border border-white/10 bg-black text-zinc-100 shadow-2xl shadow-black/30 sm:max-h-[500px] sm:max-w-lg",
				className
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex flex-col gap-y-2 border-b border-white/10 bg-white/[0.03] p-4">
				<div className="flex flex-row gap-x-2">
					{/* Close */}
					<div
						className="group relative h-3 w-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-pointer"
						onClick={onClose}
					>
						<div
							className={cn(
								"absolute inset-0 flex items-center justify-center transition-opacity duration-150",
								isHovered ? "opacity-100" : "opacity-0"
							)}
						>
							<X size={6} className="text-black" strokeWidth={3} />
						</div>
					</div>

					{/* Minimize */}
					<div
						className="group relative h-3 w-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors duration-150 cursor-pointer"
						onClick={onMinimize}
					>
						<div
							className={cn(
								"absolute inset-0 flex items-center justify-center transition-opacity duration-150",
								isHovered ? "opacity-100" : "opacity-0"
							)}
						>
							<Minus size={6} className="text-black" strokeWidth={3} />
						</div>
					</div>

					{/* Maximize */}
					<div
						className="group relative h-3 w-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-150 cursor-pointer"
						onClick={onMaximize}
					>
						<div
							className={cn(
								"absolute inset-0 flex items-center justify-center transition-opacity duration-150",
								isHovered ? "opacity-100" : "opacity-0"
							)}
						>
							<Maximize2 size={6} className="text-black" strokeWidth={3} />
						</div>
					</div>
				</div>
			</div>
			<pre className="p-4">
				<code className="grid gap-y-1 overflow-auto text-zinc-100">{children}</code>
			</pre>
		</div>
	);
};
