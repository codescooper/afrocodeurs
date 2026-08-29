export const EVENT_TYPES = ["LIVE", "COURSE", "WEBINAR", "WORKSHOP", "MEETUP", "MENTORING", "CONFERENCE"] as const;
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = { LIVE: "Live", COURSE: "Cours", WEBINAR: "Webinaire", WORKSHOP: "Atelier", MEETUP: "Rencontre", MENTORING: "Mentorat", CONFERENCE: "Conférence" };
export const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
export const EVENT_FORMAT_LABELS: Record<(typeof EVENT_FORMATS)[number], string> = { ONLINE: "En ligne", IN_PERSON: "Présentiel", HYBRID: "Hybride" };
export const EVENT_PLATFORMS = [
  "Discord",
  "BigBlueButton",
  "Jitsi",
  "YouTube Live",
  "Google Meet",
  "Zoom",
  "Autre",
] as const;
