import {SegmentData} from './Main';
import {AbsoluteFill, OffthreadVideo, Series} from 'remotion';


type SliceComponents = {
	speed: number,
	duration: number,
	videoStartFrame: number
}
/**
 * Computes SliceComponents from the given segment data. Of note, the spaces in between
 * segments (e.g. "and", music: before/after country name) are converted into seperate
 * Slice components
 * @param segments
 */
const slicesFromSegments = (segments: SegmentData[]): SliceComponents[] => {
	const temp =  segments.flatMap((s, i, segmentArray) => {
		// Skip over any spacing elements
		if (s.endFrame === undefined) {
			return []
		}

		// First segment with speed adjustment
		const firstDuration = s.endFrame - s.startFrame
		const speed = (s.videoEndFrame! - s.videoStartFrame!) / firstDuration
		const slices: SliceComponents[] = [{
			speed,
			duration: firstDuration,
			videoStartFrame: s.videoStartFrame!
		}]

		// Second in-between element with guaranteed speed of 1
		// Only have if there IS a gap between elements
		const secondDuration = (i < segments.length - 1) ?
			segmentArray[i + 1].videoStartFrame! - s.videoEndFrame! : 20;
		if (secondDuration > 0) {
			slices.push({
				speed: 1.0,
				duration: secondDuration,
				videoStartFrame: s.videoEndFrame!
			})
		}

		return slices
	})

	// Add in first slice component for the start of the video
	temp.unshift({
		speed: 1.0,
		duration: temp[0].videoStartFrame,
		videoStartFrame: 0
	})

	return temp
}


type Props = {
	segments: SegmentData[],
	src: string
}
export const TimeSlicedVideo = ({src, segments}: Props) => {

	// NOTE: Need to split audio and video due to weird bug where the audio sources
	//       will FIRST adjust playback rate, and THEN decide where to start from.
	//       Therefore, need to adjust the start frame only for the audio to compensate
	//       for this limitation. This is the opposite of expected behaviour, as seen
	//       for the video portion of the Video component.
	//
	// NOTE: Audio processing in remotion is actually quite terrible. Adjacent audio
	//       clips do not place nicely together, there is a noticeable popping noise
	//       due to blank audio being inserted in between the clips. This seems to be
	//       because everything is processed only in terms of the video framerate, where
	//       the audio frame rate is much higher. I cannot even make a cross-fade to avoid
	//       this issue since the volume calculation for the audio is done stepwise at
	//       each video frame instead of each audio sample... Going to generate audio
	//       in a python script instead and combine with FFMPEG
	return <Series>
		{slicesFromSegments(segments).map((slice) => {
			return <Series.Sequence
				durationInFrames={slice.duration}
			>
				<AbsoluteFill>
					<OffthreadVideo
						muted src={src} startFrom={slice.videoStartFrame}
						playbackRate={slice.speed}
					/>
					{/* <Audio */}
					{/* 	src={src} placeholder={undefined} */}
					{/* 	startFrom={slice.videoStartFrame / slice.speed} */}
					{/* 	playbackRate={slice.speed} */}
					{/* /> */}
				</AbsoluteFill>
			</Series.Sequence>
		})}
	</Series>
}