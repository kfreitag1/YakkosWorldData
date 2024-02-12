import {AbsoluteFill} from 'remotion';
import {DescriptionData} from './index';
import {DATA_FONT, TITLE_FONT_BOLD} from './fonts';

type Props = {
	title: string,
	descriptionData: DescriptionData
}

export const EndCard = ({title, descriptionData}: Props) => {

	return <AbsoluteFill style={{
		padding: '4vh'
	}}>
		<h1 style={{
			fontFamily: TITLE_FONT_BOLD,
			fontSize: `8vh`,
			margin: `0 auto`,
			color: 'white',
		}}>{title}</h1>
		<h2 style={{
			color: 'white',
			fontFamily: DATA_FONT,
			fontSize: '4vh',
			marginTop: '4vh',
			marginBottom: 0
		}}><i>World Data Bank indicator</i> &nbsp; – &nbsp; {descriptionData.indicator}</h2>
		<p style={{
			color: 'white',
			fontFamily: DATA_FONT,
			fontSize: '4vh'
		}}>{descriptionData.definition}</p>
		{descriptionData.source ? <p style={{
			color: 'white',
			fontFamily: DATA_FONT,
			fontSize: '2vh',
			marginTop: 0
		}}><i>Source: </i>{descriptionData.source}</p> : null}
		<p style={{
			color: 'white',
			fontFamily: DATA_FONT,
			fontSize: '2vh',
		}}>
			Data licence: {descriptionData.license}
		</p>
	</AbsoluteFill>
}