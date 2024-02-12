import {continueRender} from 'remotion'
import {staticFile} from 'remotion'
import {delayRender} from 'remotion'
import {loadFont as DATA_FONT_LOADER} from '@remotion/google-fonts/NotoSerif';

// Serif data font, tabular digits
export const { fontFamily: DATA_FONT} = DATA_FONT_LOADER("normal", {
	weights: ["400", "600", "700"]
})

// Sans serif title font, indicator/country names
const _waitForFonts = delayRender()
export const _TITLE_FONT = new FontFace(
	"DIN2014-DemiBold",
	`url('${staticFile("fonts/DIN2014-DemiBold.ttf")}') format('truetype')`
)
export const _TITLE_FONT_BOLD = new FontFace(
	"DIN2014-ExtraBold",
	`url('${staticFile("fonts/DIN2014-ExtraBold.ttf")}') format('truetype')`
)
Promise.all([
	_TITLE_FONT.load(),
	_TITLE_FONT_BOLD.load()
]).then(() => {
	document.fonts.add(_TITLE_FONT);
	document.fonts.add(_TITLE_FONT_BOLD);
	continueRender(_waitForFonts)
}).catch((err) => console.log(err))
export const TITLE_FONT = _TITLE_FONT.family
export const TITLE_FONT_BOLD = _TITLE_FONT_BOLD.family