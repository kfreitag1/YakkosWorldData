import {Easing} from 'remotion'
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CountryItemCollection} from './CountryItemCollection';
import {staticFile} from 'remotion';
import {AnimatedTitle} from './AnimatedTitle';
import {TimeSlicedVideo} from './TimeSlicedVideo';
import {BackgroundType} from './ScrollingBackground';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {DescriptionData} from './index';
import {EndCard} from './EndCard';

export type CountryData = {
	name: string,						// Displayable country name
	extraInfo?: string,			// If NOT a country, italicised explanation of it
	data?: string,					// Raw numeric data
	dataString?: string,		// Formatted data string
	dataDate?: number,			// Year of most recent data
	flag?: string,					// Filename of flag image
	rank?: number						// Rank of data amongst all countries
}

export type SegmentData = {
	country?: CountryData,		// Country data (if none: spacing element)
	startFrame: number,				// Composition frame to start
	endFrame?: number,	  		// Composition frame to end
	videoStartFrame?: number,	// Frame in video of segment start
	videoEndFrame?: number,		// Frame in video of segment end
}

export type MainProps = {
	segments: SegmentData[],
	title: string,
	titleBackground: BackgroundType,
	videoDuration: number,
	extraDuration: number,
	descriptionData: DescriptionData
}

export const Main = ({segments, title, titleBackground, videoDuration,
											 extraDuration, descriptionData}: MainProps) => {
	const frame = useCurrentFrame();

	return <>
		<TimeSlicedVideo
			src={staticFile("newvideo.mp4")}
			segments={segments}
		/>
		<TransitionSeries>
			<TransitionSeries.Sequence
				durationInFrames={videoDuration - 110 + 30}>
				<AnimatedTitle
					title={title}
					background={titleBackground}
					startMovementFrame={120}
				/>
				<CountryItemCollection segments={segments}/>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition
				timing={linearTiming({
					durationInFrames: 30, easing: Easing.inOut(Easing.ease)})}
				presentation={slide({direction: 'from-bottom'})}
			/>
			<TransitionSeries.Sequence
				durationInFrames={110 + extraDuration + 30}>
				<AbsoluteFill style={{
					backgroundColor: frame >= videoDuration ? 'black' : '',
				}}>
					<EndCard title={title} descriptionData={descriptionData} />
				</AbsoluteFill>
				{/* <AbsoluteFill style={{ */}
				{/* 	backgroundColor: frame >= videoDuration ? 'black' : '', */}
				{/* }}> */}
				{/* 	<h1 style={{color: 'red', fontSize: 200}}>HELLO</h1> */}
				{/* </AbsoluteFill> */}
			</TransitionSeries.Sequence>
		</TransitionSeries>
		{/* <AbsoluteFill style={{ */}
		{/* 	opacity: interpolate(frame, [duration-100, duration-80], */}
		{/* 		[1, 0], { */}
		{/* 		extrapolateLeft: 'clamp', extrapolateRight: 'clamp' */}
		{/* 	}) */}
		{/* }}> */}
		{/* </AbsoluteFill> */}
	</>
}