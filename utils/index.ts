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


export const normalizeParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;


// convert normal to iso

/**
 * Converts a human-readable duration to ISO format.
 * Examples:
 *  "30 days"   => "P30D"
 *  "2 weeks"   => "P14D"  (optional: weeks converted to days)
 *  "3 months"  => "P3M"
 *  "1 year"    => "P1Y"
 */
export const formatToISO = (label: string): string => {
  console.log('label->', label)
  if (!label) return "";

  const match = label.trim().toLowerCase().match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/);
  if (!match) return "";

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "day":
    case "days":
      return `P${value}D`;
    case "week":
    case "weeks":
      return `P${value * 7}D`; // convert weeks to days
    case "month":
    case "months":
      return `P${value}M`;
    case "year":
    case "years":
      return `P${value}Y`;
    default:
      return "";
  }
};


export const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, "").trim();
};


export const formatLocalDate = (date: Date | null) => {
  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getDiscountLabel = (data: any): string | null => {
  if (!data) return null;

  if (data.on_full_discount) {
    return '100% off (Forever)';
  }

  if (data.discount_ends_at) {
    const expiresDate = new Date(data.discount_ends_at).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );

    return `${data.discount_description} (Expires: ${expiresDate})`;
  }

  return null;
};
