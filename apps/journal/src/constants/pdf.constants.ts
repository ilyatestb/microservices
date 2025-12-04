export const PDF_CONSTANTS = {
  document: {
    pageSize: 'A4',
    margin: 50,
  },
  fonts: {
    mainTitle: 24,
    sectionTitle: 14,
    bodyText: 12,
  },
  colors: {
    primary: 'black',
    secondary: 'gray',
    error: 'red',
  },
  spacing: {
    afterMainTitle: 0.5,
    afterSectionTitle: 0.3,
    textIndent: 20,
    beforeSummary: 7,
    afterChart: 15,
  },
  chart: {
    verticalOffset: 10,
    width: 500,
  },
  timeAggregation: {
    dayInMs: 1000 * 60 * 60 * 24,
    hourlyThresholdDays: 2,
    datePadLength: 2,
    datePadChar: '0',
    monthOffset: 1,
  },
}
