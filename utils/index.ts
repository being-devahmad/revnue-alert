export const formatISODuration = (duration: string): string => {
  if (!duration) return "N/A";

  // Remove the starting 'P'
  const d = duration.replace(/^P/, "");

  // Regex to match number + unit
  const match = d.match(/(\d+)(D|W|M|Y)/);
  if (!match) return duration;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "D":
      return value === 1 ? "1 day" : `${value} days`;
    case "W":
      return value === 1 ? "1 week" : `${value} weeks`;
    case "M":
      return value === 1 ? "1 month" : `${value} months`;
    case "Y":
      return value === 1 ? "1 year" : `${value} years`;
    default:
      return duration;
  }
};
