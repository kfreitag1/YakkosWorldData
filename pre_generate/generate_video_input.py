import json

import pandas as pd
import numpy as np
from scipy.optimize import Bounds, curve_fit

from generate import (INDICATOR, FORMAT_STRING, TITLE,
                      TITLE_BACKGROUND, MIN_SPEED, MAX_SPEED,
                      INEQUALITY_PRESERVATION_FACTOR, ASCENDING_RANK)
from utilities import (nonnull, min_max_normalize, circular_function,
                       time_string_seconds, seconds_to_frames, none)


def generate_lyric_data(lyric_data: pd.DataFrame, indicator_data: pd.DataFrame):
    indicator_lyric_data = lyric_data.merge(indicator_data, how="left", on="Country.Code")

    # Remove entries that don't have a value for Country.Short.Name
    indicator_lyric_data = indicator_lyric_data[indicator_lyric_data["Country.Short.Name"].notna()]

    # Clean up data dates, make integers
    indicator_lyric_data["Recent.Date"] = indicator_lyric_data["Recent.Date"].apply(nonnull(int))

    # Make formatted data strings
    indicator_lyric_data["Recent.Data.String"] = (
        indicator_lyric_data["Recent.Data"].apply(nonnull(lambda x: FORMAT_STRING.format(x))))

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
    xdata = [i * 1 / size for i in range(size)]
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

    return indicator_lyric_data


def create_output_file(indicator_lyric_data: pd.DataFrame, indicator_info: pd.DataFrame):
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