# Import series data

ANS_data <- read.csv("../raw_data/Adjusted-Net-Savings_CSV/Adjusted-Net-SavingsData.csv")
ANS_series <- read.csv("../raw_data/Adjusted-Net-Savings_CSV/Adjusted-Net-SavingsSeries.csv")

ESG_data <- read.csv("../raw_data/ESG_CSV/ESGData.csv")
ESG_series <- read.csv("../raw_data/ESG_CSV/ESGSeries.csv")

GEN_data <- read.csv("../raw_data/Gender_Stats_CSV/Gender_StatsData.csv")
GEN_series <- read.csv("../raw_data/Gender_Stats_CSV/Gender_StatsSeries.csv")

HEF_data <- read.csv("../raw_data/HEFPI_CSV/HEFPIData.csv")
HEF_series <- read.csv("../raw_data/HEFPI_CSV/HEFPISeries.csv")

HNP_data <- read.csv("../raw_data/HNP_Stats_CSV/HNP_StatsData.csv")
HNP_series <- read.csv("../raw_data/HNP_Stats_CSV/HNP_StatsSeries.csv")

IDS_data <- read.csv("../raw_data/IDS_CSV/IDS_ALLCountries_Data.csv")
IDS_series <- read.csv("../raw_data/IDS_CSV/IDS_SeriesMetaData.csv")

POP_data <- read.csv("../raw_data/Population-Estimates_CSV/Population-EstimatesData.csv")
POP_series <- read.csv("../raw_data/Population-Estimates_CSV/Population-EstimatesSeries.csv")

WDI_data <- read.csv("../raw_data/WDI_CSV/WDICSV.csv")
WDI_series <- read.csv("../raw_data/WDI_CSV/WDISeries.csv")

WGI_data <- read.csv("../raw_data/WGI_CSV/WGIData.csv")
WGI_series <- read.csv("../raw_data/WGI_CSV/WGISeries.csv")

# Combine series data 

collections <- c("ANS", "ESG", "GEN", "HEF", "HNP", "IDS", "POP", "WDI", "WGI")

library(dplyr)
library(stringr)

combine_series <- function(collection_names) {
  combined_series <- do.call(bind_rows, lapply(collection_names, function(name) {
    temp <- cbind(get(paste(name, "_series", sep="")), Collection = name)
    temp$Base.Period <- NULL
    temp$Other.web.links <- NULL
    temp$X <- NULL
    temp$Dataset <- NULL
    temp$Related.indicators <- NULL
    temp$Related.source.links <- NULL
    
    # Rename Code to Series.Code
    names(temp)[names(temp) == 'Code'] <- 'Series.Code'
    
    return(temp)
  }))
  
  distinct(combined_series, Series.Code, .keep_all = TRUE)
}

ALL_series <- combine_series(collections)
write.csv(ALL_series, file = "series.csv", row.names = FALSE)

# Combine data

# Return same date frame with date columns replaced by Recent.Data, Recent.Date
collapse_recent_data <- function(collection_name) {
  all_data <- get(paste(collection_name, "_data", sep=""))
  all_data$X <- NULL
  
  # Rename Indicator to Series
  names(all_data)[names(all_data) == 'Indicator.Name'] <- 'Series.Name'
  names(all_data)[names(all_data) == 'Indicator.Code'] <- 'Series.Code'
  
  # Remove counterpart data
  all_data$Counterpart.Area.Code <- NULL
  all_data$Counterpart.Area.Name <- NULL
  
  # Extract date columns
  date_cols <- colnames(all_data)[str_detect(colnames(all_data), "^[Xx]")]
  other_cols <- colnames(all_data)[!(colnames(all_data) %in% date_cols)]
  
  # Loop through all indicators and get the most recent data
  recent_data <- apply(all_data[, date_cols], 1, function(current_row) {
    for (date in rev(date_cols)) {
      check_value <- current_row[[date]]
      if (!is.na(check_value)) {
        formatted_date <- str_sub(date, start=2L)
        return(c(check_value, formatted_date))
      }
    }
    # Couldn't find any date for this row, just return NA, NA
    return(c(NA, NA))
  })
  
  # Transpose data and give proper names
  recent_data <- t(recent_data)
  colnames(recent_data) <- c("Recent.Data", "Recent.Date")
  
  # Combine data and return
  cbind(all_data[, other_cols], recent_data)
}

combine_recent_data <- function(collection_names) {
  combined_frame <- do.call(bind_rows, lapply(collection_names, function(name) {
    return(cbind(collapse_recent_data(name), Collection = name))
  }))
  
  # Remove duplicate rows
  semi_join(combined_frame, ALL_series, by=c("Series.Code", "Collection"))
}

ALL_data <- combine_recent_data(collections)
# write.csv(ALL_data, file = "data.csv", row.names = FALSE)



















