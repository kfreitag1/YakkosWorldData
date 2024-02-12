// import {interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
// import {SegmentData} from './Main';
//
// type PlaybackData = { speed: number, videoFrame: number }
//
//
// const playbackDataAtCompFrame = (frame: number, segments: SegmentData[]): PlaybackData => {
// 	let speed = 1.0			// Default speed (before reaching any segments)
// 	let videoFrame = frame;	// Default video frame start, same as comp
//
// 	for (let i = segments.length - 1; i >= 0; i--) {
// 		// Find the segment that started just before the current comp frame
// 		const s = segments[i]
// 		if (frame >= s.startFrame) {
// 			if (frame < s.endFrame!) {
// 				// Within this segment, speed is adjusted
// 				speed = (s.videoEndFrame! - s.videoStartFrame!) /
// 					(s.endFrame! - s.startFrame)
// 				videoFrame = Math.floor(interpolate(frame,
// 					[s.startFrame, s.endFrame!],
// 					[s.videoStartFrame!, s.videoEndFrame!]))
// 			} else {
// 				// In between segments, regular speed
// 				videoFrame = s.videoEndFrame! + (frame - s.endFrame!)
// 			}
// 			break;
// 		}
// 	}
//
// 	return {
// 		speed,
// 		videoFrame
// 	};
// }
//
//
// type Props = {
// 	segments: SegmentData[],
// 	src: string
// }
//
// export const TimeAdjustedVideo = ({src, segments}: Props) => {
// 	const frame = useCurrentFrame();
// 	const {speed, videoFrame} = playbackDataAtCompFrame(frame, segments)
//
// 	return <Sequence from={frame}>
// 		<OffthreadVideo
// 			src={src}
// 			startFrom={frame}
// 			playbackRate={1}
// 		/>
// 	</Sequence>
// }