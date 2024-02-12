# ------------------------------------------------------------------------------
# Imports
# ------------------------------------------------------------------------------

# Import country data

all_countries <- read.csv("../country_data/WDB_all_countries.csv")
lyric_countries <- read.csv("../country_data/lyric_country_data.csv")

#aggregate_countries <- read.csv("../country_data/selected_aggregates.csv", header = FALSE)
#colnames(aggregate_countries) <- c("Country.Code", "Short.Name")

excluded_countries <- read.csv("../country_data/excluded_non_countries.csv", header=FALSE)
colnames(excluded_countries) <- colnames(all_countries)

# Import series and actual data

all_data <- read.csv("data.csv")
all_series <- read.csv("series.csv")

# ------------------------------------------------------------------------------
# Calculate percent completion for all indicators
# ------------------------------------------------------------------------------

percent_complete <- function(frame) {
  apply(all_series, 1, function(row) {
    indicator_data <- frame[frame$Series.Code == row["Series.Code"], ]
    is_filled_data <- !is.na(indicator_data$Recent.Date)
    
    return(sum(is_filled_data) / length(is_filled_data))
  })
}

# Percentage completion for the countries in the video
all_series$Percent.Video <- percent_complete(
  all_data[all_data$Country.Code %in% lyric_countries$Country.Code, ]
)

# Percentage completion for all countries and aggregates
all_series$Percent.Total <- percent_complete(all_data)

# Sort based on Percent.Video
all_series_sorted <- all_series[order(-all_series$Percent.Video),]

write.csv(all_series_sorted, file="series_sorted.csv", row.names=F)

# Filtered sorted list
filtered_sorted_list <- all_series_sorted[, 
  c("Series.Code", "Indicator.Name", "Long.definition", 
    "Percent.Video", "Percent.Total")
]

write.csv(filtered_sorted_list, file="series_filtered.csv", row.names=F)








