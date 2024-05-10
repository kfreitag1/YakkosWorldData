import sys

import pandas as pd
from generate_audio import generate_audio_file
from generate_video_input import generate_lyric_data, create_output_file
from generate_video_input import generate_lyric_data, create_output_file, generate_formatted_indicator_data

# -----------------------------------------------------
# VIDEO PARAMETERS
# -----------------------------------------------------

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
    # -----------------------------------------------------
    # IMPORT DATA
    # -----------------------------------------------------

    # Lyric: "Country.Code", "Lyric", "Country.Short.Name", "Start.Time",
    #        "End.Time", "Flag.Filename", "Extra.Info", "Notes"
    lyric_data = pd.read_csv("../country_data/lyric_country_data.csv")

    # Series: "Series.Code", "Topic", "Indicator.Name", "Short.definition",
    #         "Long.definition", "Unit.of.measure", "Periodicity",
    #         "Other.notes", "Aggregation.method", "Limitations.and.exceptions",
    #         "Notes.from.original.source", "General.comments", "Source",
    #         "Statistical.concept.and.methodology", "Development.relevance",
    #         "License.Type", "Collection"
    series_data = pd.read_csv(
        "../clean_data/series.csv", encoding="ISO-8859-1")

    # Data: "Country.Name", "Country.Code", "Series.Name", "Series.Code",
    #       "Recent.Data", "Recent.Date", "Collection"
    all_data = pd.read_csv(
        "../clean_data/data.csv", encoding="ISO-8859-1")

    # -----------------------------------------------------
    # COMPUTE INDICATOR LYRIC DATA
    # -----------------------------------------------------

    indicator_info = series_data[series_data["Series.Code"] == INDICATOR]
    indicator_data = all_data[all_data["Series.Code"] == INDICATOR]
    indicator_lyric_data = generate_lyric_data(lyric_data, indicator_data)

    # Data ... "Recent.Date", "Recent.Data.String"
    indicator_data = generate_formatted_indicator_data(all_data, INDICATOR,
                                                       FORMAT_STRING)

    # Data ... "Rank", "Normalized.Data.Linear", "Normalized.Data.Circular",
    #          "Speed", "Video.Start.Frame", "Video.End.Frame",
    #          "Start.Frame", "End.Frame"
    indicator_lyric_data = generate_lyric_data(lyric_data, indicator_data,
                                               ASCENDING_RANK,
                                               INEQUALITY_PRESERVATION_FACTOR,
                                               MIN_SPEED, MAX_SPEED, FRAME_RATE)

    # -----------------------------------------------------
    # GENERATE JSON OUTPUT FILE
    # -----------------------------------------------------

    create_output_file(indicator_lyric_data, indicator_info, TITLE,
                       TITLE_BACKGROUND, INDICATOR)

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    # TODO

    # -----------------------------------------------------
    # AUDIO
    # -----------------------------------------------------

    # Generate time-mapped audio
    if not PREVIEW_ONLY:
        generate_audio_file(indicator_lyric_data)


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


