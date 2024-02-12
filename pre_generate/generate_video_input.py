import json
import math
import sys

import pandas as pd
import numpy as np
from scipy.optimize import Bounds, curve_fit
from generate_audio import generate_audio_file

INDICATOR = "SP.POP.TOTL"
FORMAT_STRING = "{:,.0f} people"
TITLE = "Population (total)"
ASCENDING_RANK = False
TITLE_BACKGROUND = "TOPOGRAPHIC"

MIN_SPEED = 0.3
MAX_SPEED = 3.5
INEQUALITY_PRESERVATION_FACTOR = 0.9

FRAME_RATE = 60
PREVIEW_ONLY = False


def main():
    # Import csv data
    lyric_data = pd.read_csv("../country_data/lyric_country_data.csv")
    series_data = pd.read_csv(
        "../clean_data/series.csv", encoding="ISO-8859-1")
    all_data = pd.read_csv(
        "../clean_data/data.csv", encoding="ISO-8859-1")

    # Get specific indicator information and data for specific countries
    indicator_info = series_data[series_data["Series.Code"] == INDICATOR]
    indicator_data = all_data[all_data["Series.Code"] == INDICATOR]
    indicator_lyric_data = lyric_data.merge(
        indicator_data, how="left", on="Country.Code")

    # Remove entries that don't have a value for Country.Short.Name
    indicator_lyric_data = indicator_lyric_data[
        indicator_lyric_data["Country.Short.Name"].notna()]

    # Clean up data dates, make integers
    indicator_lyric_data["Recent.Date"] = (
        indicator_lyric_data["Recent.Date"].apply(nonnull(int)))

    # Make formatted data strings
    indicator_lyric_data["Recent.Data.String"] = (
        indicator_lyric_data["Recent.Data"].
        apply(nonnull(lambda x: FORMAT_STRING.format(x))))

    # Compute rankings
    indicator_lyric_data["Rank"] = (
        indicator_lyric_data["Recent.Data"]
        .rank(ascending=ASCENDING_RANK, method="dense")).apply(nonnull(int))

    # Get normalized data from [0, 1], corresponding to [min, max]
    indicator_lyric_data["Normalized.Data.Linear"] = (
        indicator_lyric_data)["Recent.Data"].apply(
        nonnull(lambda x: min_max_normalize(
            x, min(indicator_lyric_data["Recent.Data"].dropna()),
            max(indicator_lyric_data["Recent.Data"].dropna()))))

    # Curve fitting normalized data to circular-like function
    nonnull_data = indicator_lyric_data["Normalized.Data.Linear"].dropna()
    size = len(nonnull_data)
    xdata = [i * 1/size for i in range(size)]
    ydata = np.sort(nonnull_data.to_numpy())
    best_coeff = curve_fit(circular_function, xdata, ydata, p0=[0.0],
                           bounds=Bounds(-0.999999, 0.99999))[0][0]

    # Compute scaled data
    indicator_lyric_data["Normalized.Data.Circular"] = (
        indicator_lyric_data["Normalized.Data.Linear"].
        apply(nonnull(lambda x: circular_function(
            x, -best_coeff * INEQUALITY_PRESERVATION_FACTOR))))

    # Compute playback speed
    indicator_lyric_data["Speed"] = (
            MIN_SPEED + indicator_lyric_data["Normalized.Data.Circular"] *
            (MAX_SPEED - MIN_SPEED))
    indicator_lyric_data["Speed"] = indicator_lyric_data["Speed"].fillna(1.0)

    # Convert start/end times to seconds
    indicator_lyric_data["Start.Time"] = (
        indicator_lyric_data["Start.Time"].apply(time_string_seconds))
    indicator_lyric_data["End.Time"] = (
        indicator_lyric_data["End.Time"].apply(time_string_seconds))

    # ... Then seconds to frames
    indicator_lyric_data["Video.Start.Frame"] = (
        indicator_lyric_data["Start.Time"].apply(seconds_to_frames))
    indicator_lyric_data["Video.End.Frame"] = (
        indicator_lyric_data["End.Time"].apply(seconds_to_frames))

    # Create remapped starting/ending frames for speed adjustment
    indicator_lyric_data["Start.Frame"] = int(0)
    indicator_lyric_data["End.Frame"] = int(0)
    prev_video_frame_end: int = 0
    prev_comp_frame_end: int = 0
    for index, row in indicator_lyric_data.iterrows():
        # Current segment video start/end
        video_frame_start = indicator_lyric_data["Video.Start.Frame"][index]
        video_frame_end = indicator_lyric_data["Video.End.Frame"][index]

        # Number of frames to play at normal speed between end of previous
        # segment and the start of this segment
        segment_spacing = video_frame_start - prev_video_frame_end
        prev_video_frame_end = video_frame_end

        # Compute starting frame
        comp_frame_start = prev_comp_frame_end + segment_spacing
        indicator_lyric_data.at[index, "Start.Frame"] = comp_frame_start

        # Compute speed adjusted segment time
        unadjusted_segment_time = video_frame_end - video_frame_start
        segment_playback_speed = indicator_lyric_data["Speed"][index]
        segment_time = int(unadjusted_segment_time / segment_playback_speed)

        # Compute ending frame based on segment playback speed
        comp_frame_end = comp_frame_start + segment_time
        indicator_lyric_data.at[index, "End.Frame"] = comp_frame_end
        prev_comp_frame_end = comp_frame_end

    # Replace all instances of NaN with None/null
    indicator_lyric_data = indicator_lyric_data.replace(np.nan, None)

    # List of each country (or non-country) segment
    segment_list = [
        {
            "country": {
                "name": row["Country.Short.Name"],
                "flag": row["Flag.Filename"],
                "data": row["Recent.Data"],
                "rank": row["Rank"],
                "dataString": row["Recent.Data.String"],
                "dataDate": row["Recent.Date"],
                "extraInfo": row["Extra.Info"]
            },
            "startFrame": row["Start.Frame"],
            "endFrame": row["End.Frame"],
            "videoStartFrame": row["Video.Start.Frame"],
            "videoEndFrame": row["Video.End.Frame"],
        }
        for _, row in indicator_lyric_data.iterrows()
    ]

    output_object = {
        "segments": segment_list,
        "title": TITLE,
        "titleBackground": TITLE_BACKGROUND,
        "indicator": INDICATOR,
        "source": none(indicator_info["Source"].values[0]),
        "definition": none(indicator_info["Long.definition"].values[0]),
        "limitations": none(indicator_info["Limitations.and.exceptions"].values[0]),
        "license": none(indicator_info["License.Type"].values[0]),
    }

    # Serializing json
    json_object = json.dumps(output_object, indent=4)

    # Writing to filename
    with open("../generate_video/public/input.json", "w") as outfile:
        outfile.write(json_object)

    # Generate time-mapped audio
    if not PREVIEW_ONLY:
        generate_audio_file(indicator_lyric_data)


def nonnull(func):
    return lambda x: func(x) if pd.notna(x) else None


def none(x):
    return x if pd.notna(x) else None


# Requires: min != max, val in interval [min, max]
def min_max_normalize(val, min_val, max_val):
    return (val - min_val) / (max_val - min_val)


# Requires: x interval [0,1], coeff interval (-1, 1)
def circular_function(x, coeff):
    # Crazy complicated circular like interpolation function
    a = math.sqrt(1-coeff) * math.sqrt(1+coeff)
    b = 1/a + coeff/a
    return np.power(1 - np.power(1-x, b), 1/b)


def time_string_seconds(time_str: str):
    return sum([
        a * b for a, b in zip([60, 1], map(float, time_str.split(':')))
    ])


def seconds_to_frames(secs: float):
    return int(secs * FRAME_RATE)


if __name__ == "__main__":
    # Ran from the bash script, get input values (assume accurate):
    if len(sys.argv) > 1:
        INDICATOR = sys.argv[1]
        FORMAT_STRING = sys.argv[2]
        TITLE = sys.argv[3]
        ASCENDING_RANK = sys.argv[4] == 'true'
        TITLE_BACKGROUND = sys.argv[5]

        MIN_SPEED = float(sys.argv[6])
        MAX_SPEED = float(sys.argv[7])
        INEQUALITY_PRESERVATION_FACTOR = float(sys.argv[8])

        PREVIEW_ONLY = sys.argv[9] == 'true'

        print(INDICATOR)
        print(FORMAT_STRING)
        print(TITLE)
        print(ASCENDING_RANK)
        print(TITLE_BACKGROUND)
        print(MIN_SPEED)
        print(MAX_SPEED)
        print(INEQUALITY_PRESERVATION_FACTOR)

    main()


