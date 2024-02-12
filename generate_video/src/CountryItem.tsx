import {Img, interpolate, interpolateColors, staticFile} from 'remotion';
import {CountryData} from './Main';
import {DATA_FONT, TITLE_FONT} from './fonts';

const HEIGHT = 15
const WIDTH = 72
const MIN_SCALE = 0.92
const GAP = 2

const BOTTOM_COLOUR = "#0C7BDC"
const TOP_COLOUR = "#ECAD0E"


/**
 * Computes the scaling factor of the element based on its relative value.
 * Scale of 1.0 occurs exactly when the relative value is 1.0
 * @param relVal relative positional value
 */
const scale = (relVal: number): number => {
	return interpolate(
		Math.abs(relVal),
		[0, 1], [1.0, MIN_SCALE], {
			extrapolateRight: 'clamp'
		})
}

/**
 * Computes the y-position of the element based on its relative value. Position (vh units)
 * is relative to a baseline value of y=0 at a relative value of 0.0.
 * @param relVal relative positional value
 */
const position = (relVal: number): number => {
	// Clamped relVal from -1.0 to 1.0 to get percent scaled
	const signedPercentScaled =
		Math.min(1.0, Math.max(-1.0, relVal))

	// After scaling, this is the amount the element moves by
	const extraTranslationAmount = relVal - signedPercentScaled

	// Contribution from the larger centre scaled element
	return 0.5 * HEIGHT * signedPercentScaled +
		// Contribution from the preceding smaller elements
		(0.5 * signedPercentScaled + extraTranslationAmount) * HEIGHT * MIN_SCALE +
		// Contribution from the multiple gap spaces
		relVal * GAP
}

const BottomText = ({country}: {country: CountryData}) => {
	const dateElement =
		<span style={{
			fontSize: `${HEIGHT * 0.19}vh`,
			marginRight: `${HEIGHT * 0.13}vh`,
			fontFamily: DATA_FONT,
			fontWeight: '600'
		}}>{country.dataDate}</span>

	return <>
		<span style={{
			fontSize: `${HEIGHT * (country.data ? 0.25 : 0.21)}vh`,
			marginLeft: `${HEIGHT * 0.13}vh`,
			fontFamily: DATA_FONT,
			fontStyle: country.data ? "normal" : "italic",
			fontWeight: '400'
		}}>{country.data ? country.dataString : (country.extraInfo ?? "no data")}
		</span>
		{country.data && dateElement}
	</>;
}

const rankColour = (rank: number): string => {
	// TODO: Be more precice in calculating percentage through global parameters file
	//       since there could be multiple countries with same rank, ALSO may want to
	//       change in the future
	const percent = rank / 147
	return interpolateColors(percent, [0,1], [BOTTOM_COLOUR, TOP_COLOUR])
}

const RankTag = ({rank}: {rank?: number}) => {
	if (rank) {
		return <span style={{
			fontFamily: DATA_FONT,
			fontWeight: '700',
			fontSize: `${HEIGHT * 0.25}vh`,
			color: 'white',
			paddingInline: `${HEIGHT * 0.11}vh`,
			borderRadius: `${HEIGHT * 0.12}vh`,
			marginRight: `${HEIGHT * 0.1}vh`,
			backgroundColor: rankColour(rank)
		}}>{rank}</span>;
	}
	return null;
}

const Flag = ({flagFilename}: {flagFilename?: string}) => {
	if (flagFilename) {
		return <Img
			src={staticFile(`flags/${flagFilename}`)}
			placeholder={undefined}
			style={{
				height: `100%`,
				borderRadius: `${HEIGHT*0.05}vh`,
				filter: `drop-shadow(2px 2px 1.5px rgba(0,0,0,0.2)) drop-shadow(-0.8px -0.8px 0.5px rgba(255,255,255,0.05))`,
				transform: `translate(${-HEIGHT*0.05}vh, ${-HEIGHT*0.05}vh) scale(1.05)`
			}}
		/>
	}
	return null
}

type Props = {
	country: CountryData,
	relVal: number	// (0 is main position, 1.0 is one element above main)
}

/**
 * Single country item element containing the country info (rank, data, name, flag).
 * Relatively positioned in the composition based on the current relative value of the
 * video (i.e. which country is being sung, currently on = main center element, after
 * sung = scrolling upwards).
 * @param country country data of this element
 * @param relVal relative positional value
 * @constructor
 */
export const CountryItem = ({country, relVal}: Props) => {
	return <div style={{
		width: `${WIDTH}vh`,
		height: `${HEIGHT}vh`,
		backgroundColor: `rgba(255, 255, 255, 0.55)`,
		backdropFilter: `blur(${HEIGHT*0.25}vh)`,
		position: 'absolute',
		borderRadius: `${HEIGHT*0.2}vh`,
		boxShadow: `3px 3px 10px -5px rgba(0,0,0,0.8), -3px -3px 10px -5px rgba(255, 255, 255, 0.3)`,
		right: 20,
		bottom: "10vh",
		display: "flex",
		flexDirection: "column",
		gap: `${HEIGHT*0.03}vh`,
		transform: `translateY(${-position(relVal)}vh) scale(${scale(relVal)})`,
		transformOrigin: "center right"
	}}>
		<div style={{
			height: `${HEIGHT/2}vh`,
			display: 'flex',
			flexDirection: 'row',
			alignItems: "center"
		}}>
			<Flag flagFilename={country.flag}/>
			<span style={{
				fontSize: `${HEIGHT*0.31}vh`,
				marginTop: 0,
				marginBottom: 0,
				marginLeft: `${HEIGHT*0.13}vh`,
				fontFamily: TITLE_FONT,
				alignSelf: "flex-end",
				flexGrow: 1,
			}}>{country.name}</span>
			<RankTag rank={country.rank} />
		</div>
		<div style={{
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: "baseline"
		}}>
			<BottomText country={country} />
		</div>
	</div>
}
