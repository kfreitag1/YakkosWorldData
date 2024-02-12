// import {interpolate, Sequence} from 'remotion';
// import {AbsoluteFill, Audio, staticFile} from 'remotion';
//
// const volumeForFrame = (f: number) => {
// 	// if (f < 5) {
// 	// 	return interpolate(f, [0, 2], [0.0, 1.0], {
// 	// 		extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
// 	// 	})
// 	// }
// 	return interpolate(f, [8, 10], [1.0, 0.0], {
// 		extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
// 	})
// }
//
// export const TestAudio = () => {
// 	return <>
// 		{[...Array(10)].map((e, i) => {
// 			return <Sequence from={i * 10} durationInFrames={11}>
// 				<AbsoluteFill>
// 					<Audio
// 						src={staticFile('tone.mp3')}
// 						startFrom={5}
// 						placeholder={undefined}
// 						volume={(f) => volumeForFrame(f)}
// 					/>
// 				</AbsoluteFill>
// 			</Sequence>
// 		})}
// 	</>
// }