import numpy as np
import pandas as pd

MISSING_COUNTRIES = ["ABW", "AND", "ARM", "ATG", "AZE", "BFA", "BIH", "BLR", "CIV", "CPV",
                     "CUW", "DMA", "ERI", "EST", "FSM", "GEO", "GNQ", "GRD", "HRV", "KAZ",
                     "KGZ", "KIR", "KNA", "LCA", "LTU", "LVA", "MDA", "MDV", "MHL", "MKD",
                     "MNE", "MUS", "NCL", "NRU", "PLW", "PRK", "PYF", "SGP", "SLB", "SMR",
                     "SRB", "SSD", "STP", "SVN", "SYC", "TJK", "TKM", "TLS", "TON", "TUV",
                     "UKR", "UZB", "VCT", "VUT", "WSM", "XKX", "ZAF"]


def generate_description(indicator_info: pd.DataFrame, indicator_data: pd.DataFrame):
    output_string = ""

    # TITLE
    output_string += indicator_info["Indicator.Name"].values[0] + "\n\n"

    # DESCRIPTION
    if indicator_info["Long.definition"].values[0] is not None:
        output_string += indicator_info["Long.definition"].values[0] + "\n\n"

    # OTHER COUNTRIES
    missing_data = indicator_data[indicator_data["Country.Code"].isin(MISSING_COUNTRIES)].copy()
    missing_data = missing_data.replace(np.nan, None)

    output_string += "*Countries not mentioned (with data)*\n"
    for _, row in missing_data.iterrows():
        if row["Recent.Data.String"] is not None:
            output_string += (row["Country.Name"] + " – " + row["Recent.Data.String"] +
                              " (" + str(int(row["Recent.Date"])) + ")\n")
    output_string += "\n"

    # SOURCE
    if indicator_info["Source"].values[0] is not None:
        output_string += "*Source* "
        output_string += indicator_info["Source"].values[0] + "\n\n"

    # INDICATOR
    output_string += "*WDB Indicator* " + indicator_info["Series.Code"].values[0]

    return output_string

