import mongoose from "mongoose";
function m(name) { try { return mongoose.model(name); } catch { return null; } }

export async function searchAll(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ leads: [], contacts: [], deals: [], activities: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const Lead = m("Lead") || m("Leads");
    const Contact = m("Contact") || m("Contacts");
    const Deal = m("Deal") || m("Deals");
    const Task = m("Task") || m("Tasks");
    const Meeting = m("Meeting") || m("Meetings");
    const Call = m("Call") || m("Calls");

    const [leads, contacts, deals, tasks, meetings, calls] = await Promise.all([
      Lead ? Lead.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
              .select("name email phone").limit(10).lean() : [],
      Contact ? Contact.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
                .select("name email phone").limit(10).lean() : [],
      Deal ? Deal.find({ $or: [{ title: rx }, { stage: rx }] })
              .select("title amount stage status").limit(10).lean() : [],
      Task ? Task.find({ $or: [{ subject: rx }, { description: rx }] })
              .select("subject dueDate status").limit(5).lean() : [],
      Meeting ? Meeting.find({ $or: [{ subject: rx }, { location: rx }] })
                .select("subject dueDate status").limit(5).lean() : [],
      Call ? Call.find({ $or: [{ subject: rx }, { with: rx }] })
              .select("subject dueDate status").limit(5).lean() : [],
    ]);

    const activities = [
      ...tasks.map(x => ({ ...x, type: "Task" })),
      ...meetings.map(x => ({ ...x, type: "Meeting" })),
      ...calls.map(x => ({ ...x, type: "Call" })),
    ].slice(0, 10);

    res.json({ leads, contacts, deals, activities });
  } catch (e) {
    console.error("[searchAll]", e);
    res.json({ leads: [], contacts: [], deals: [], activities: [] });
  }
}
