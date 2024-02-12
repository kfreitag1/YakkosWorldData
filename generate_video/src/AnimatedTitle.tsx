import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {TITLE_FONT_BOLD} from './fonts';
import {BackgroundType, ScrollingBackground} from './ScrollingBackground';

const DELAY = 1.2
const LETTER_DURATION = 35

const START_POSITION = -1.2
const PEAK_POSITION = 1.4

const FONT_SIZE = 10
const SMALL_FONT_SIZE = 7
const BOTTOM_DISTANCE = 20
const MOVEMENT_DURATION = 60


/**
 * Computes the individual letter position for the intro entrance animation.
 * Letters fly in from the bottom, one by one, and bounce once to come to a stop.
 * @param frame current frame
 * @param index index of the letter to animate
 * @return relative position (em)
 */
const letterPosition = (frame: number, index: number): number => {
	/**
	 * Partial easing function to bounce once before resting
	 */
	const bounceOnceEasing = (t: number): number => {
		return t < 0.5 ? 4*t**2 : 4*(t-0.75)**2+0.75
	}

	/**
	 * Easing function to fly in from bottom, and bounce once before resting
	 */
	const flyBounceEasing = (t: number): number => {
		const threshold = 0.35
		if (t < threshold) {
			return interpolate(t, [0, threshold], [0, PEAK_POSITION], {
				easing: Easing.out(Easing.cubic)
			})
		}
		return interpolate(t, [threshold, 1], [PEAK_POSITION, 1], {
			easing: bounceOnceEasing
		})
	}

	return interpolate(frame,
		[index * DELAY, index * DELAY + LETTER_DURATION],
		[START_POSITION, 0], {
			extrapolateRight: 'clamp',
			extrapolateLeft: 'clamp',
			easing: flyBounceEasing
		})
}


type TitleTransProperties = {
	titleScale: number,
	titleBottom: number,
	titleLeft: number,
}
/**
 * Compute the transformation properties of the title to move it to the top
 * left corner after being in the center of the screen.
 * @param frame current frame
 * @param startMovementFrame frame to begin movement to top left
 */
const titleMovement = (frame: number, startMovementFrame: number): TitleTransProperties => {
	const percent = interpolate(frame,
		[startMovementFrame, startMovementFrame + MOVEMENT_DURATION],
		[0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.inOut(Easing.exp)
		})

	// Scale starts at 1.0 and decreases in order to reach the SMALL_FONT_SIZE
	const titleScale = interpolate(percent, [0,1],
		[1, SMALL_FONT_SIZE/FONT_SIZE])

	// Percentage from the left hand edge to centre, keep some distance after movement
	const titleLeft = interpolate(percent, [0,1],
		[50, 1.5])

	// Distance (vh) from the bottom of the composition to the bottom edge of the title
	const titleBottom = interpolate(percent, [0,1],
		[BOTTOM_DISTANCE, 100 - FONT_SIZE*titleScale*1.4])

	return {titleScale, titleLeft, titleBottom}
}

/**
 * Construct the clip path for the slide-in and wipe-out transitions of the
 * scrolling background underneath the centered title.
 * @param frame current frame
 * @param startMovementFrame frame to start movement of the title (also wipe-out transition)
 * @returns string to pass to clipPath
 */
const backgroundClipPath = (frame: number, startMovementFrame: number): string => {
	// Slide in from left
	if (frame < startMovementFrame) {
		const percentSlide = interpolate(frame,
			[0, 20], [0, 100], {
				extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
				easing: Easing.out(Easing.ease)
			})
		return `polygon(0 0, 0 100%, ${percentSlide}% 100%, ${percentSlide}% 0)`
	}

	// Wipe out from top and bottom
	const percentWipe = interpolate(frame,
		[startMovementFrame, startMovementFrame + 20], [0, 100], {
			extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
			easing: Easing.ease
	})
	const bottom = percentWipe / 2
	const top = 100 - bottom
	return `polygon(0 ${bottom}%, 0 ${top}%, 100% ${top}%, 100% ${bottom}%)`
}


type Props = {
	title: string,
	startMovementFrame: number,
	background: BackgroundType,
}
/**
 * Represents an animated title that takes up the centre of the screen, and then
 * shrinks and moves to the top left corner of the composition.
 * @param title text of the title to display
 * @param startMovementFrame frame to begin title movement to the top left
 * @param background pattern of scrolling background
 * @constructor
 */
export const AnimatedTitle = ({title, startMovementFrame, background}: Props) => {
	const frame = useCurrentFrame();
	const { titleScale, titleLeft, titleBottom } =
		titleMovement(frame, startMovementFrame);

	return <>
		<div style={{
			width: '100%',
			height: `${FONT_SIZE * 1.6}vh`,
			position: 'absolute',
			bottom: `${BOTTOM_DISTANCE * 0.95}vh`,
			filter: `drop-shadow(5px 5px 6px rgba(0,0,0,0.4))`
		}}>
			<div style={{
				height: `100%`,
				clipPath: backgroundClipPath(frame, startMovementFrame),
			}}>
				<ScrollingBackground type={background} />
			</div>
		</div>
		<AbsoluteFill>
			<span style={{
				overflow: frame > startMovementFrame ? 'visible' : 'hidden',
				position: 'absolute',
				display: 'inline-block',
				whiteSpace: 'nowrap',
				bottom: `${titleBottom}vh`,
				left: `${titleLeft}%`,
				transform: `scale(${titleScale}) translateX(-${titleLeft}%)`,
				transformOrigin: 'bottom left'
			}}>
				{title.split('').map((letter, i) => {
					return <span style={{
						fontSize: `${FONT_SIZE}vh`,
						fontFamily: TITLE_FONT_BOLD,
						color: 'white',
						display: 'inline-block',
						whiteSpaceCollapse: 'preserve',
						transform: `translateY(${-letterPosition(frame, i)}em)`,
						marginBottom: `-${FONT_SIZE*0.1}vh`,
						marginTop: `${FONT_SIZE/2}vh`,
						textShadow: `3px 3px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(255,255,255,0.1)`
					}}>
						{letter}
					</span>
				})}
			</span>
		</AbsoluteFill>
	</>
}