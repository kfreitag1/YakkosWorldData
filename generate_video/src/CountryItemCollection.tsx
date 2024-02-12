import {CountryItem} from './CountryItem';
import {Easing, EasingFunction, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {SegmentData} from './Main';

const TRANSITION_DELAY = 10	 // (frames)
const TRANSITION_EASING: EasingFunction = Easing.inOut(Easing.ease)
const NUM_BEFORE = 2	// Number of elements before main to render
const NUM_AFTER = 6		// Number of elements after main to render

type TransitionTime = [relativeIndex: number, relativeFrame: number]

/**
 * Computes the relative positional value of the given frame in terms of
 * the starting times of each country. I.e. Suppose country A is from frames 0-10,
 * B from 10-30, and C from 40-50. Frame TODO
 * @param transitions
 * @param frame
 */
const relativeValueAtFrame = (transitions: TransitionTime[], frame: number): number => {

	// Starting position before beginning is just minimum
	// let relativePosition = transitions[0][0];
	let relativePosition: number;

	// Loop through transitions and find current segment to compute position
	for (let i = 0; i < transitions.length; i++) {
		const [relIndex, relFrame] = transitions[i];

		if (frame >= relFrame) {
			// Currently within this segment, must be at LEAST this way through
			relativePosition = relIndex

			// Update position if in the next transition (also if it exists)
			if (i < transitions.length - 1) {
				const [, nextFrame] = transitions[i + 1]

				// Transition time is the smallest between the normal delay and the
				// difference in the frames, to prevent jumping
				const frameDiff = nextFrame - relFrame;
				const delay = Math.min(frameDiff, TRANSITION_DELAY)

				relativePosition += interpolate(frame,
					[nextFrame - delay, nextFrame],
					[0.0, 1.0],
					{
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: TRANSITION_EASING
					}
				)
			}
		}
	}
	return relativePosition!
}

/**
 * Video element representing the timed collection of moving CountryItems.
 * The items scroll upwards based on the given segment data.
 * @param segments data to construct and time CountryItems
 * @constructor
 */
export const CountryItemCollection = ({segments}: {segments: SegmentData[]}) => {
	const frame = useCurrentFrame()

	return <>
		{segments.flatMap((s, index) => {

			// Only create visual elements for segments with country data
			if (s.country === undefined) {
				return []  // Skip over
			}

			// Get transition times for segments before and after this one
			const segmentsAroundThis = segments.slice(
				// From NUM_BEFORE before index (as much as possible)
				Math.max(0, index - NUM_BEFORE),
				// To NUM_AFTER after index (as much as possible)
				Math.min(segments.length, index + NUM_AFTER + 1)
			)

			// Construct TransitionTime elements with the index and starting frame
			let transitions: TransitionTime[] = segmentsAroundThis.flatMap((s) => {
				const segmentIndex = segments.indexOf(s);
				const transitions: TransitionTime[] = [[segmentIndex - index, s.startFrame]];
				// Add in final hold to the very last segment
				if ((segmentIndex === (segments.length - 1)) && s.endFrame) {
					transitions.push([segmentIndex - index, s.endFrame])
				}
				return transitions
			})

			// Shift transition times to make the starting time when it should appear
			const absoluteStartingFrame = transitions[0][1]
			transitions = transitions.map(([index, frame]) => {
				return [index, frame - absoluteStartingFrame]
			})

			// Compute relative frame from this starting frame, and total duration
			const relativeFrame = frame - absoluteStartingFrame
			const totalDuration = transitions[transitions.length - 1][1]

			// Only show this segment if it needs to be shown right now (to save resources)
			if (frame >= absoluteStartingFrame) {
				return [<Sequence durationInFrames={totalDuration} from={absoluteStartingFrame}>
					<CountryItem
						country={s.country!}
						relVal={relativeValueAtFrame(transitions, relativeFrame)}
					/>
				</Sequence>];
			}
			return []
		})}
		</>
}