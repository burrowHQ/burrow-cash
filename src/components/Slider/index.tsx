import { Slider as MUISlider, Box } from "@mui/material";

const marks = [
	{
		value: 0,
		label: "0%",
	},
	{
		value: 25,
		label: "25%",
	},
	{
		value: 50,
		label: "50%",
	},
	{
		value: 75,
		label: "75%",
	},
	{
		value: 100,
		label: "100%",
	},
];

function valuetext(value: number) {
	return `${value}%`;
}

interface Props {
	value: number;
	onChange?: (e: Event) => void;
}

const Slider = ({ value, onChange }: Props) => {
	return (
		<Box sx={{ padding: "0 1.5rem", margin: "0 auto" }}>
			<MUISlider
				aria-label="Custom marks"
				value={value}
				getAriaValueText={valuetext}
				valueLabelDisplay="auto"
				step={1}
				valueLabelFormat={(v) => `${Math.round(v)}%`}
				marks={marks}
				onChange={onChange}
			/>
		</Box>
	);
};

export default Slider;
