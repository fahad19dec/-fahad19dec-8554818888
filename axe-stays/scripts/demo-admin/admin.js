// The browser demo's admin page (demo-site/admin.html): a stand-in for the
// Next.js dashboard in ../admin, for hosting as static files. It edits the
// same localStorage data the demo guest app reads (src/lib/demo/store.ts), so
// approvals, edits, bans and cancellations show up in the app.
//
// scripts/build-demo.mjs puts BRAND, SEED and the compiled shared code
// (pricing, report reasons, demo store) in front of this file.
/* global BRAND, SEED, quote, guestRefund, formatCents, todayIso, REPORT_REASONS,
   DEMO_ADMIN_EMAIL, demoStoreKey, loadStore, saveStore, ensureUser, applyStayEdits, addSampleActivity */

const KEY = demoStoreKey(BRAND.slug);
const SESSION_KEY = `${BRAND.slug}.demo.admin`;
const appUrl = new URL("./", location.href).href;

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtDate = (iso) => new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtDateTime = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const policyName = Object.fromEntries(SEED.policies.map((p) => [p.slug, p.title]));
const hostName = Object.fromEntries(SEED.hosts.map((h) => [h.slug, h.name]));

// ---- Data -----------------------------------------------------------------------

function store() {
  const data = loadStore(KEY);
  if (!data.sampled) {
    addSampleActivity(data, SEED.stays);
    saveStore(KEY, data);
  }
  return data;
}

let session = null;
try {
  session = localStorage.getItem(SESSION_KEY);
} catch {}

/** The signed-in admin, re-read from the data on every change, like the server's assertAdmin. */
function admin(data = store()) {
  const user = session && data.users[session];
  if (!user || user.role !== "admin" || user.status === "banned") throw new Error("Only admins can do that.");
  return user;
}

/** Runs one admin change: check the role, apply it, log it, save, re-render. */
function change(action, target, work, message) {
  const data = store();
  try {
    const actor = admin(data);
    work(data, actor);
    data.audit.unshift({ at: new Date().toISOString(), actor: actor.email, action, target });
    saveStore(KEY, data);
    toast(message);
  } catch (error) {
    toast(error.message, true);
  }
  render();
}

const stays = (data) => applyStayEdits(SEED.stays, data);
const stayById = (data, id) => stays(data).find((s) => s.id === id);

// ---- Shell ----------------------------------------------------------------------

const NAV = [
  ["overview", "Overview", "M3 3v18h18M7 15v2M11 11v6M15 7v10M19 12v5"],
  ["listings", "Listings", "M3 11 12 4l9 7v9H3zM9 20v-6h6v6"],
  ["bookings", "Bookings", "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"],
  ["users", "Users", "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"],
  ["reports", "Reports", "M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1"],
  ["activity", "Activity", "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"],
];
const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const logo = (onDark = true) => {
  const { handle, handleWidth, head, poll, handleColor, headColor } = BRAND.logo;
  const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(" ");
  return `<svg class="logo" viewBox="0 0 100 100" aria-hidden="true">
    <line x1="${handle[0][0]}" y1="${handle[0][1]}" x2="${handle[1][0]}" y2="${handle[1][1]}" stroke="${onDark ? handleColor : "var(--ink)"}" stroke-width="${handleWidth}" stroke-linecap="round"/>
    <polygon points="${pts(head)}" fill="${headColor}"/><polygon points="${pts(poll)}" fill="${headColor}"/></svg>`;
};

function render() {
  const root = document.getElementById("root");
  const data = store();
  const user = session && data.users[session];
  if (!user) return (root.innerHTML = loginView());
  if (user.role !== "admin" || user.status === "banned") return (root.innerHTML = noAccessView(user));

  const route = (location.hash.slice(2) || "overview").split("?")[0];
  const page = VIEWS[route] ? route : "overview";
  const openReports = data.reports.filter((r) => r.status === "open").length;
  root.innerHTML = `
    <div class="shell">
      <aside class="side">
        <div class="brand">${logo()}<div><strong>${esc(BRAND.wordmark)}</strong><span>Admin</span></div></div>
        <nav>${NAV.map(
          ([id, label, d]) => `<a href="#/${id}" class="${id === page ? "active" : ""}">${icon(d)}<span>${label}</span>${
            id === "reports" && openReports ? `<b class="count">${openReports}</b>` : ""
          }</a>`,
        ).join("")}</nav>
        <div class="me">
          <a class="app-link" href="${appUrl}">Open the guest app ↗</a>
          <div class="who"><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div>
          <button class="link" data-act="signout">Sign out</button>
        </div>
      </aside>
      <main>${VIEWS[page](data)}</main>
    </div>`;
}

function loginView() {
  return `<div class="center"><form class="card login" data-form="login">
    <div class="brand">${logo(false)}<div><strong>${esc(BRAND.wordmark)}</strong><span>Admin</span></div></div>
    <h1>Sign in</h1>
    <p class="muted">Admins only. In this demo, use <button type="button" class="link" data-act="fill">${DEMO_ADMIN_EMAIL}</button>. Any other email signs in as a guest without access.</p>
    <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email" placeholder="you@example.com" value="${DEMO_ADMIN_EMAIL}"></label>
    <button class="btn primary wide">Continue</button>
    <a class="muted small" href="${appUrl}">Back to the guest app</a>
  </form></div>`;
}

function noAccessView(user) {
  return `<div class="center"><div class="card login">
    <h1>No access</h1>
    <p class="muted">${esc(user.email)} ${user.status === "banned" ? "is suspended" : "isn’t an admin"}. The dashboard checks the role on every page and every change.</p>
    <button class="btn wide" data-act="signout">Sign in with another account</button>
  </div></div>`;
}

const header = (title, sub, extra = "") => `<header class="page-head"><div><h1>${title}</h1><p class="muted">${sub}</p></div>${extra}</header>`;
const badge = (text, tone) => `<span class="badge ${tone}">${esc(text)}</span>`;
const tabs = (base, current, items) =>
  `<div class="tabs" role="tablist">${items
    .map(([id, label]) => `<a role="tab" aria-selected="${id === current}" href="#/${base}?${id}">${label}</a>`)
    .join("")}</div>`;
const query = () => decodeURIComponent(location.hash.split("?")[1] ?? "");
const empty = (text) => `<div class="empty">${text}</div>`;

// ---- Overview -------------------------------------------------------------------

function series(days, items, dateOf, valueOf = () => 1) {
  const start = Date.now() - (days - 1) * 86_400_000;
  const out = Array.from({ length: days }, (_, i) => ({ day: new Date(start + i * 86_400_000).toISOString().slice(0, 10), value: 0 }));
  const index = Object.fromEntries(out.map((d, i) => [d.day, i]));
  for (const item of items) {
    const i = index[dateOf(item).slice(0, 10)];
    if (i !== undefined) out[i].value += valueOf(item);
  }
  return out;
}

function chart(title, points, money) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 300, h = 120, gap = 2, bw = w / points.length - gap;
  const label = (v) => (money ? formatCents(v) : String(v));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const bars = points
    .map((p, i) => {
      const bh = p.value ? Math.max(3, (p.value / max) * h) : 0;
      return `<g><rect class="hit" x="${i * (bw + gap)}" y="0" width="${bw + gap}" height="${h}"/><rect class="bar" x="${i * (bw + gap)}" y="${h - bh}" width="${bw}" height="${bh}" rx="2"/><title>${fmtDate(p.day)}: ${label(p.value)}</title></g>`;
    })
    .join("");
  const ticks = [0, 0.5, 1].map((f) => `<line x1="0" x2="${w}" y1="${h - f * h}" y2="${h - f * h}"/>`).join("");
  return `<section class="card chart">
    <h2>${title}</h2><p class="muted">${label(total)} in 30 days</p>
    <svg viewBox="0 -8 ${w} ${h + 26}" role="img" aria-label="${title}, ${label(total)} in 30 days">
      <g class="grid">${ticks}</g>${bars}
      <text x="0" y="${h + 16}">${fmtDate(points[0].day).replace(/, \d+$/, "")}</text>
      <text x="${w}" y="${h + 16}" text-anchor="end">Today</text>
      <text x="0" y="-1" class="max">${label(max)}</text>
    </svg>
    <details><summary>Show as table</summary><table class="mini"><tbody>${points
      .filter((p) => p.value)
      .map((p) => `<tr><td>${fmtDate(p.day)}</td><td class="num">${label(p.value)}</td></tr>`)
      .join("") || "<tr><td>Nothing yet</td></tr>"}</tbody></table></details>
  </section>`;
}

function overviewView(data) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const users = Object.values(data.users);
  const recent = data.bookings.filter((b) => b.createdAt >= since);
  const kept = (b) => (b.status === "confirmed" ? b.serviceFeeCents : Math.max(0, b.serviceFeeCents - Math.max(0, b.refundCents - (b.totalCents - b.serviceFeeCents))));
  const revenue = recent.reduce((s, b) => s + kept(b), 0);
  const gmv = recent.reduce((s, b) => s + b.totalCents, 0);
  const refunds = recent.reduce((s, b) => s + b.refundCents, 0);
  const today = todayIso();
  const upcoming = data.bookings.filter((b) => b.status === "confirmed" && b.checkIn >= today).length;
  const openReports = data.reports.filter((r) => r.status === "open").length;
  const tile = (label, value, note) => `<div class="card tile"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
  return `${header("Overview", "Last 30 days. Payments are simulated, so money figures are what guests would have paid.")}
    ${openReports ? `<a class="attention" href="#/reports">${icon(NAV[4][2])} ${openReports} open report${openReports > 1 ? "s" : ""} →</a>` : ""}
    <div class="tiles">
      ${tile("Revenue", formatCents(revenue), "Service fees kept, after refunds")}
      ${tile("Booking value", formatCents(gmv), `${formatCents(refunds)} refunded`)}
      ${tile("Bookings", recent.length, `${recent.filter((b) => b.status === "cancelled").length} cancelled · ${upcoming} upcoming stays`)}
      ${tile("New signups", users.filter((u) => u.createdAt >= since).length, `${users.length} users in total`)}
    </div>
    <div class="charts">
      ${chart("Signups per day", series(30, users, (u) => u.createdAt))}
      ${chart("Bookings per day", series(30, data.bookings, (b) => b.createdAt))}
      ${chart("Revenue per day", series(30, data.bookings, (b) => b.createdAt, kept), true)}
    </div>
    <section class="card"><h2>Recent admin activity</h2>${activityList(data.audit.slice(0, 6))}<a href="#/activity" class="small">See all activity</a></section>`;
}

// ---- Listings -------------------------------------------------------------------

function listingsView(data) {
  const all = stays(data);
  const filter = query() || "approved";
  const counts = { approved: 0, rejected: 0 };
  for (const s of all) counts[s.status]++;
  const shown = all
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const bookings = (id) => data.bookings.filter((b) => b.stayId === id && b.status === "confirmed").length;
  const rows = shown
    .map(
      (s) => `<tr>
      <td><div class="stay"><img src="${esc(s.photos[0]?.url)}" alt="" loading="lazy"><div><strong>${esc(s.title)}</strong><small>${esc(s.city)}${s.region ? `, ${esc(s.region)}` : ""} · ${hostName[s.hostSlug] ?? "Host"} · ${bookings(s.id)} booking${bookings(s.id) === 1 ? "" : "s"}${s.status === "approved" ? ` · <a href="${appUrl}#/stay/${esc(s.slug)}">View in app</a>` : ""}</small>${
        s.status === "rejected" && data.stays[s.id]?.note ? `<small class="note">Note: ${esc(data.stays[s.id].note)}</small>` : ""
      }</div></div></td>
      <td>${esc(s.type)}</td>
      <td class="num">$${s.pricePerNight}</td>
      <td>${badge(s.status === "approved" ? "Approved" : "Rejected", s.status === "approved" ? "good" : "bad")}</td>
      <td class="actions">
        <button class="btn sm" data-act="edit" data-id="${s.id}">Edit</button>
        ${s.status === "approved" ? `<button class="btn sm danger" data-act="reject" data-id="${s.id}">Reject</button>` : `<button class="btn sm primary" data-act="approve" data-id="${s.id}">Approve</button>`}
      </td></tr>`,
    )
    .join("");
  return `${header("Listings", "Approved listings show to guests. Rejecting hides one from the app right away.")}
    ${tabs("listings", filter, [["approved", `Approved (${counts.approved})`], ["rejected", `Rejected (${counts.rejected})`], ["all", `All (${all.length})`]])}
    <div class="card table-wrap">${rows ? `<table><thead><tr><th>Listing</th><th>Type</th><th class="num">Per night</th><th>Status</th><th class="actions">Actions</th></tr></thead><tbody>${rows}</tbody></table>` : empty("No listings here.")}</div>
    <p class="muted small">New listings are created in the full dashboard (<code>admin/</code>), which needs a server. This demo edits the 30 sample listings.</p>`;
}

function editListing(id) {
  const s = stayById(store(), id);
  dialog(
    `Edit ${esc(s.title)}`,
    `<label class="field"><span>Title</span><input name="title" value="${esc(s.title)}" maxlength="80" required></label>
     <label class="field"><span>Summary</span><textarea name="summary" rows="3" maxlength="300">${esc(s.summary)}</textarea></label>
     <div class="row">
       <label class="field"><span>Price per night ($)</span><input name="pricePerNight" type="number" min="10" max="10000" step="1" value="${s.pricePerNight}" required></label>
       <label class="field"><span>Cleaning fee ($)</span><input name="cleaningFee" type="number" min="0" max="2000" step="1" value="${s.cleaningFee ?? 0}"></label>
       <label class="field"><span>Max guests</span><input name="maxGuests" type="number" min="1" max="30" step="1" value="${s.maxGuests}" required></label>
     </div>`,
    "Save changes",
    (form) => {
      const title = form.title.value.trim();
      if (title.length < 3) return "Title needs at least 3 characters.";
      const fields = {
        title,
        summary: form.summary.value.trim(),
        pricePerNight: Math.round(Number(form.pricePerNight.value)),
        cleaningFee: Math.round(Number(form.cleaningFee.value || 0)),
        maxGuests: Math.round(Number(form.maxGuests.value)),
      };
      if (!(fields.pricePerNight >= 10 && fields.pricePerNight <= 10000)) return "Price must be between $10 and $10,000.";
      if (!(fields.maxGuests >= 1 && fields.maxGuests <= 30)) return "Max guests must be between 1 and 30.";
      change("listing.update", id, (data) => {
        data.stays[id] = { ...data.stays[id], ...fields, updatedAt: new Date().toISOString() };
      }, "Saved. The guest app shows the change on its next load.");
    },
  );
}

function setStatus(id, status, note) {
  change(`listing.${status === "approved" ? "approve" : "reject"}`, id, (data) => {
    data.stays[id] = { ...data.stays[id], status, note: note || null, updatedAt: new Date().toISOString() };
  }, status === "approved" ? "Approved. Guests can see it now." : "Rejected. It’s hidden from guests.");
}

// ---- Users ----------------------------------------------------------------------

function usersView(data) {
  const me = admin(data);
  const filter = query() || "all";
  const all = Object.values(data.users).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = all.filter((u) => filter === "all" || (filter === "banned" ? u.status === "banned" : u.role === "admin"));
  const count = (email) => data.bookings.filter((b) => b.email === email).length;
  const rows = shown
    .map(
      (u) => `<tr>
      <td><div class="person"><span class="avatar">${esc(u.name[0]?.toUpperCase())}</span><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small>${
        u.banReason ? `<small class="note">Banned: ${esc(u.banReason)}</small>` : ""
      }</div></div></td>
      <td><select data-act="role" data-id="${esc(u.email)}" aria-label="Role for ${esc(u.email)}" ${u.email === me.email ? "disabled title=\"You can’t change your own role\"" : ""}>
        ${["guest", "admin"].map((r) => `<option ${r === u.role ? "selected" : ""}>${r}</option>`).join("")}</select></td>
      <td>${badge(u.status === "banned" ? "Banned" : "Active", u.status === "banned" ? "bad" : "good")}</td>
      <td class="num">${count(u.email)}</td>
      <td>${fmtDate(u.createdAt)}</td>
      <td class="actions">${
        u.email === me.email
          ? `<small class="muted">You</small>`
          : u.status === "banned"
            ? `<button class="btn sm" data-act="unban" data-id="${esc(u.email)}">Unban</button>`
            : `<button class="btn sm danger" data-act="ban" data-id="${esc(u.email)}">Ban</button>`
      }</td></tr>`,
    )
    .join("");
  return `${header("Users", "Banned users can still browse the guest app, but can’t book, view trips or report.")}
    ${tabs("users", filter, [["all", `All (${all.length})`], ["admin", "Admins"], ["banned", `Banned (${all.filter((u) => u.status === "banned").length})`]])}
    <div class="card table-wrap">${rows ? `<table><thead><tr><th>User</th><th>Role</th><th>Status</th><th class="num">Bookings</th><th>Joined</th><th class="actions">Actions</th></tr></thead><tbody>${rows}</tbody></table>` : empty("No users here.")}</div>`;
}

function banUser(email) {
  dialog(
    `Ban ${esc(email)}?`,
    `<p class="muted">Their next request in the guest app is refused, and the app tells them why.</p>
     <label class="field"><span>Reason (shown to the user)</span><textarea name="reason" rows="3" maxlength="500" required placeholder="e.g. Asked guests to pay outside the app"></textarea></label>`,
    "Ban user",
    (form) => {
      const reason = form.reason.value.trim();
      if (!reason) return "Add a reason.";
      change("user.ban", email, (data, actor) => {
        if (email === actor.email) throw new Error("You can’t ban yourself.");
        Object.assign(data.users[email], { status: "banned", banReason: reason });
      }, `${email} is banned.`);
    },
    "danger",
  );
}

function setRole(email, role) {
  change("user.role", `${email} → ${role}`, (data, actor) => {
    if (email === actor.email) throw new Error("You can’t change your own role.");
    const admins = Object.values(data.users).filter((u) => u.role === "admin" && u.status === "active");
    if (role !== "admin" && admins.length <= 1 && data.users[email].role === "admin") throw new Error("There must be at least one active admin.");
    data.users[email].role = role;
  }, `Role changed to ${role}.`);
}

// ---- Bookings -------------------------------------------------------------------

function bookingsView(data) {
  const filter = query() || "upcoming";
  const today = todayIso();
  const groups = {
    upcoming: (b) => b.status === "confirmed" && b.checkOut >= today,
    past: (b) => b.status === "confirmed" && b.checkOut < today,
    cancelled: (b) => b.status === "cancelled",
    all: () => true,
  };
  const all = [...data.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = all.filter(groups[filter] ?? groups.all);
  const rows = shown
    .map((b) => {
      const s = stayById(data, b.stayId);
      return `<tr>
        <td><strong>${esc(s?.title)}</strong><small>${esc(b.id)}</small></td>
        <td>${esc(data.users[b.email]?.name ?? b.email)}<small>${esc(b.email)}</small></td>
        <td>${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}<small>${b.nights} nights · ${b.guests} guest${b.guests > 1 ? "s" : ""}</small></td>
        <td class="num">${formatCents(b.totalCents)}${b.refundCents ? `<small>${formatCents(b.refundCents)} refunded</small>` : ""}</td>
        <td>${b.status === "confirmed" ? badge("Confirmed", "good") : badge(`Cancelled by ${b.cancelledBy ?? "guest"}`, "muted")}</td>
        <td class="actions">${b.status === "confirmed" && b.checkOut >= today ? `<button class="btn sm danger" data-act="cancel" data-id="${b.id}">Cancel</button>` : ""}</td>
      </tr>`;
    })
    .join("");
  return `${header("Bookings", "Payments are simulated. Cancelling here refunds the guest and frees the dates in the app.")}
    ${tabs("bookings", filter, [["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"], ["all", `All (${all.length})`]])}
    <div class="card table-wrap">${rows ? `<table><thead><tr><th>Stay</th><th>Guest</th><th>Dates</th><th class="num">Total</th><th>Status</th><th class="actions"></th></tr></thead><tbody>${rows}</tbody></table>` : empty("No bookings here.")}</div>`;
}

function cancelBooking(id) {
  const data = store();
  const b = data.bookings.find((x) => x.id === id);
  const s = stayById(data, b.stayId);
  const policy = guestRefund(b, s.cancellationPolicySlug, s.houseRules?.checkInTime);
  dialog(
    "Cancel this booking?",
    `<p class="muted">${esc(s.title)}, ${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}, for ${esc(b.email)}. Paid ${formatCents(b.totalCents)}.</p>
     <fieldset class="choices">
       <label><input type="radio" name="mode" value="full" checked> <span><strong>Full refund: ${formatCents(b.totalCents)}</strong><small>For problems on our side or the host’s.</small></span></label>
       <label><input type="radio" name="mode" value="policy"> <span><strong>By policy: ${formatCents(policy.refundCents)}</strong><small>${esc(policyName[s.cancellationPolicySlug] ?? "Policy")}: ${esc(policy.rule)}.</small></span></label>
     </fieldset>
     <label class="field"><span>Reason</span><textarea name="reason" rows="2" maxlength="500" placeholder="e.g. Host can’t host these dates"></textarea></label>`,
    "Cancel booking",
    (form) => {
      const refund = form.mode.value === "full" ? b.totalCents : policy.refundCents;
      change("booking.cancel", id, (d) => {
        const booking = d.bookings.find((x) => x.id === id);
        if (booking.status !== "confirmed") throw new Error("That booking is already cancelled.");
        Object.assign(booking, { status: "cancelled", cancelledBy: "admin", cancelReason: form.reason.value.trim() || null, refundCents: refund, cancelledAt: new Date().toISOString() });
      }, `Cancelled. ${b.email} gets ${formatCents(refund)} back.`);
    },
    "danger",
  );
}

// ---- Reports --------------------------------------------------------------------

function reportsView(data) {
  const filter = query() || "open";
  const shown = [...data.reports]
    .filter((r) => (filter === "open" ? r.status === "open" : r.status !== "open"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cards = shown
    .map((r) => {
      const s = stayById(data, r.stayId);
      return `<article class="card report">
        <div class="report-head">${badge(REPORT_REASONS[r.reason] ?? r.reason, r.reason === "scam" || r.reason === "unsafe" ? "bad" : "warn")}
          <small class="muted">${fmtDateTime(r.createdAt)} · from ${esc(r.email)}</small></div>
        <h3>${esc(s?.title)} ${s ? badge(s.status === "approved" ? "Live" : "Hidden", s.status === "approved" ? "good" : "muted") : ""}</h3>
        ${r.details ? `<p>${esc(r.details)}</p>` : ""}
        ${r.status === "open"
          ? `<div class="actions left">
              <button class="btn sm primary" data-act="resolve" data-id="${r.id}">Resolve</button>
              ${s?.status === "approved" ? `<button class="btn sm danger" data-act="resolve-reject" data-id="${r.id}">Hide listing and resolve</button>` : ""}
              <button class="btn sm" data-act="dismiss" data-id="${r.id}">Dismiss</button></div>`
          : `<p class="muted small">${r.status === "resolved" ? "Resolved" : "Dismissed"} ${fmtDateTime(r.closedAt)}${r.resolution ? `: ${esc(r.resolution)}` : ""}</p>`}
      </article>`;
    })
    .join("");
  return `${header("Reports", "Guests report listings from the stay page in the app.")}
    ${tabs("reports", filter, [["open", `Open (${data.reports.filter((r) => r.status === "open").length})`], ["closed", "Closed"]])}
    <div class="reports">${cards || empty(filter === "open" ? "No open reports." : "Nothing closed yet.")}</div>`;
}

function closeReport(id, status, alsoReject) {
  const title = alsoReject ? "Hide the listing and resolve?" : status === "resolved" ? "Resolve this report?" : "Dismiss this report?";
  dialog(
    title,
    `${alsoReject ? `<p class="muted">The listing is rejected and disappears from the guest app.</p>` : ""}
     <label class="field"><span>What you did</span><textarea name="resolution" rows="3" maxlength="1000" ${status === "resolved" ? "required" : ""} placeholder="e.g. Asked the host to update the photos"></textarea></label>`,
    alsoReject ? "Hide and resolve" : status === "resolved" ? "Resolve" : "Dismiss",
    (form) => {
      const resolution = form.resolution.value.trim();
      if (status === "resolved" && !resolution) return "Say what you did.";
      change(`report.${status === "resolved" ? "resolve" : "dismiss"}`, id, (data) => {
        const report = data.reports.find((r) => r.id === id);
        if (report.status !== "open") throw new Error("That report was already closed.");
        if (alsoReject) data.stays[report.stayId] = { ...data.stays[report.stayId], status: "rejected", note: `From report: ${resolution}`.slice(0, 500), updatedAt: new Date().toISOString() };
        Object.assign(report, { status, resolution: resolution || null, closedAt: new Date().toISOString() });
      }, alsoReject ? "Listing hidden and report resolved." : status === "resolved" ? "Report resolved." : "Report dismissed.");
    },
    alsoReject ? "danger" : "primary",
  );
}

// ---- Activity -------------------------------------------------------------------

function activityList(items) {
  if (!items.length) return empty("No admin changes yet. Approve, edit, ban or cancel something and it’s logged here.");
  return `<ul class="activity">${items
    .map((a) => `<li><span><strong>${esc(a.actor.split("@")[0])}</strong> ${esc(a.action.replace(".", " "))} <code>${esc(a.target)}</code></span><time>${fmtDateTime(a.at)}</time></li>`)
    .join("")}</ul>`;
}

const activityView = (data) => `${header("Activity", "Every admin change, newest first.")}<section class="card">${activityList(data.audit)}</section>`;

const VIEWS = { overview: overviewView, listings: listingsView, bookings: bookingsView, users: usersView, reports: reportsView, activity: activityView };

// ---- Dialog and toast -----------------------------------------------------------

function dialog(title, body, confirm, onSubmit, tone = "primary") {
  const el = document.getElementById("dialog");
  el.innerHTML = `<form method="dialog" class="dialog-body"><h2>${title}</h2>${body}<p class="error" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn ${tone}">${confirm}</button></div></form>`;
  const form = el.querySelector("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const problem = onSubmit(form.elements);
    if (problem) form.querySelector(".error").textContent = problem;
    else el.close();
  });
  el.querySelector("[data-close]").addEventListener("click", () => el.close());
  el.showModal();
  el.querySelector("input:not([type=radio]), textarea")?.focus();
}

let toastTimer;
function toast(message, bad = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `show ${bad ? "bad" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ""), 3500);
}

// ---- Events ---------------------------------------------------------------------

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-act]");
  if (!target) return;
  const { act, id } = target.dataset;
  if (act === "fill") document.querySelector("input[name=email]").value = DEMO_ADMIN_EMAIL;
  if (act === "signout") {
    session = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    render();
  }
  if (act === "edit") editListing(id);
  if (act === "approve") setStatus(id, "approved");
  if (act === "reject")
    dialog(
      "Reject this listing?",
      `<p class="muted">It disappears from search and its page in the guest app. Existing trips keep it.</p>
       <label class="field"><span>Note for the team (optional)</span><textarea name="note" rows="2" maxlength="500"></textarea></label>`,
      "Reject",
      (form) => setStatus(id, "rejected", form.note.value.trim()),
      "danger",
    );
  if (act === "ban") banUser(id);
  if (act === "unban") change("user.unban", id, (data) => Object.assign(data.users[id], { status: "active", banReason: null }), `${id} can use the app again.`);
  if (act === "cancel") cancelBooking(id);
  if (act === "resolve") closeReport(id, "resolved");
  if (act === "dismiss") closeReport(id, "dismissed");
  if (act === "resolve-reject") closeReport(id, "resolved", true);
});

document.addEventListener("change", (event) => {
  const target = event.target.closest("[data-act=role]");
  if (target) setRole(target.dataset.id, target.value);
});

document.addEventListener("submit", (event) => {
  if (event.target.dataset.form !== "login") return;
  event.preventDefault();
  const email = event.target.email.value.trim().toLowerCase();
  const data = store();
  ensureUser(data, email);
  saveStore(KEY, data);
  session = email;
  try {
    localStorage.setItem(SESSION_KEY, email);
  } catch {}
  if (!location.hash) location.hash = "#/overview";
  render();
});

window.addEventListener("hashchange", render);
// Another tab (the guest app) changed the data.
window.addEventListener("storage", (event) => event.key === KEY && render());
render();
