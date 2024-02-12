import {CalculateMetadataFunction, Composition, registerRoot, staticFile} from 'remotion';
import React from 'react';
import {Main, MainProps, SegmentData} from './Main';
import {BackgroundType} from './ScrollingBackground';

const INPUT_SEGMENTS_FILEPATH = "input.json"
const TOTAL_VIDEO_FRAMES = 6044
const EXTRA_FRAMES_FOR_END_CARD = 60
const INITIAL_FRAME_BEFORE_FIRST_SEGMENT = 160

export type DescriptionData = {
	indicator: string,
	source?: string,
	definition?: string,
	limitations?: string,
	license?: string
}

type InputData = DescriptionData & {
	segments: SegmentData[],
	title: string,
	titleBackground?: string,
}

const calculateInputData: CalculateMetadataFunction<MainProps> =
		async () => {

	// Read segment data JSON file, parsing unsafely with eval because I'm a bad boy
	const jsonData = await fetch(staticFile(INPUT_SEGMENTS_FILEPATH));
	// eslint-disable-next-line no-eval
	const inputData: InputData = JSON.parse(await jsonData.text());
	const {segments} = inputData;

	// Add in spacing elements to start of video
	segments.unshift({
		"startFrame": 1,
	},{
		"startFrame": INITIAL_FRAME_BEFORE_FIRST_SEGMENT,
	});

	// Spacing elements at end of video
	const sudan = segments[segments.length - 1]
	const totalFramesAfter = TOTAL_VIDEO_FRAMES - sudan.videoEndFrame!
	const totalVideoDuration = sudan.endFrame! + totalFramesAfter
	segments.push({
		"startFrame": sudan.endFrame!,
		"endFrame": totalVideoDuration,
		"videoStartFrame": sudan.videoEndFrame!,
		"videoEndFrame": TOTAL_VIDEO_FRAMES
	});

	// Other input data
	const backgroundKey = inputData.titleBackground ?? "TOPOGRAPHIC";
	const titleBackground =
		BackgroundType[backgroundKey as keyof typeof BackgroundType]

	return {
		props: {
			segments,
			title: inputData.title,
			titleBackground,
			videoDuration: totalVideoDuration,
			extraDuration: EXTRA_FRAMES_FOR_END_CARD,
			descriptionData: {
				indicator: inputData.indicator,
				source: inputData.source,
				definition: inputData.definition,
				limitations: inputData.limitations,
				license: inputData.license
			}
		},
		durationInFrames: totalVideoDuration + EXTRA_FRAMES_FOR_END_CARD
	}
}

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="main"
				component={Main}
				fps={60}
				width={1280}
				height={720}
				defaultProps={{
					segments: [],
					title: "UNTITLED",
					titleBackground: BackgroundType.TOPOGRAPHIC,
					videoDuration: 0,
					extraDuration: 0,
					descriptionData: {
						indicator: ""
					}
				}}
				calculateMetadata={calculateInputData}
			/>
		</>
	);
};

registerRoot(RemotionRoot);