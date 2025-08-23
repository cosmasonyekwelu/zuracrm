// server/src/utils/ics.js
const CRLF = "\r\n";
const esc = (s="") => String(s).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

const toICSDate = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const z = new Date(d);
  return `${z.getUTCFullYear()}${pad(z.getUTCMonth()+1)}${pad(z.getUTCDate())}T${pad(z.getUTCHours())}${pad(z.getUTCMinutes())}${pad(z.getUTCSeconds())}Z`;
};

export function buildICS({ meeting, method = "REQUEST", organizer }) {
  // organizer = { name, email }
  const lines = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("PRODID:-//Zura CRM//Meeting//EN");
  lines.push("VERSION:2.0");
  lines.push(`METHOD:${method}`);
  lines.push("CALSCALE:GREGORIAN");

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${esc(meeting.iCalUid)}`);
  lines.push(`DTSTAMP:${toICSDate(new Date())}`);
  lines.push(`DTSTART:${toICSDate(meeting.startAt)}`);
  lines.push(`DTEND:${toICSDate(meeting.endAt)}`);
  lines.push(`SEQUENCE:${Number(meeting.iCalSeq || 0)}`);
  if (meeting.rrule) lines.push(`RRULE:${meeting.rrule}`);
  if (meeting.subject) lines.push(`SUMMARY:${esc(meeting.subject)}`);
  if (meeting.location) lines.push(`LOCATION:${esc(meeting.location)}`);
  if (meeting.notes) lines.push(`DESCRIPTION:${esc(meeting.notes)}`);
  if (meeting.joinUrl) lines.push(`URL:${esc(meeting.joinUrl)}`);

  if (organizer?.email) {
    const cn = organizer?.name ? `;CN=${esc(organizer.name)}` : "";
    lines.push(`ORGANIZER${cn}:MAILTO:${esc(organizer.email)}`);
  }

  (meeting.attendees || []).forEach((a) => {
    if (!a?.email) return;
    const cn = a?.name ? `;CN=${esc(a.name)}` : "";
    const ps = (a?.status || "NEEDS-ACTION").toUpperCase();
    const rsvp = ps === "NEEDS-ACTION" ? ";RSVP=TRUE" : "";
    lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT${cn};PARTSTAT=${ps}${rsvp}:MAILTO:${esc(a.email)}`);
  });

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
