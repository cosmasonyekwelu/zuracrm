// server/src/workers/reminders.worker.js
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import { sendCalendarEmail } from "../utils/email.js";

export async function runRemindersOnce() {
  const now = Date.now();
  const due = await Meeting.find({
    nextReminderAt: { $lte: new Date(now + 15*1000) }, // small grace
    startAt: { $gte: new Date(now - 5*60*1000) },      // not too old
  }).limit(50);

  for (const m of due) {
    await Promise.all((m.attendees||[]).filter(a=>a.email).map(a =>
      sendCalendarEmail({
        to: a.email,
        subject: `Reminder: ${m.subject}`,
        text: `Starts at ${m.startAt.toISOString()}\nJoin: ${m.joinUrl}`,
      }).catch(()=>{})
    ));
    m.nextReminderAt = null;
    await m.save();
  }
}

// In server bootstrap (dev-friendly interval)
// setInterval(()=>runRemindersOnce().catch(()=>{}), 60*1000);
