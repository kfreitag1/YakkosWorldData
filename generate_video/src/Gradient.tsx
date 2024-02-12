import {AbsoluteFill, interpolateColors} from 'remotion';

const DIVISIONS = 100

const START_COLOR = "#0C7BDC"
const END_COLOR = "#ECAD0E"

const colour = (index: number) => {
	return interpolateColors(index, [0, DIVISIONS - 1],
		[START_COLOR, END_COLOR])
}

export const Gradient = () => {
	return <AbsoluteFill>
		{Array.from(Array(DIVISIONS), (_e, i) => {
			return <div
				key={i}
				style={{
					height: `100%`,
					backgroundColor: colour(i),
					width: `${100/DIVISIONS}%`,
					position: 'absolute',
					left: `${i*100/DIVISIONS}%`
				}}
			>{i}</div>
		})}
	</AbsoluteFill>
}