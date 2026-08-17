export const EVENT_TYPES = ["LIVE", "WEBINAR", "WORKSHOP", "MEETUP", "MENTORING", "CONFERENCE"] as const;
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = { LIVE: "Live", WEBINAR: "Webinaire", WORKSHOP: "Atelier", MEETUP: "Rencontre", MENTORING: "Mentorat", CONFERENCE: "Conférence" };
export const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
export const EVENT_FORMAT_LABELS: Record<(typeof EVENT_FORMATS)[number], string> = { ONLINE: "En ligne", IN_PERSON: "Présentiel", HYBRID: "Hybride" };
