import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const assets = {
  landing: path.join(root, "WhatsApp Image 2026-03-11 at 3.32.38 PM.jpeg"),
  dashboard: path.join(root, "Pasted image.png"),
};

const colors = {
  ink: "171717",
  navy: "121828",
  gold: "FFC107",
  coral: "FF6B6B",
  mint: "C9F3E8",
  teal: "55D6BE",
  lavender: "EDE7FF",
  sky: "CFE8FF",
  gray: "D5D6DA",
  smoke: "F7F7F5",
  white: "FFFFFF",
  plum: "7C3AED",
};

const fonts = {
  heading: "Oswald",
  body: "Nunito Sans",
  serif: "Merriweather",
  accent: "Niconne",
};

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Codex";
pptx.company = "EEC";
pptx.subject = "EEC B2C brand and product presentation";
pptx.title = "EEC B2C Brand Guide";
pptx.lang = "en-IN";
pptx.theme = {
  headFontFace: fonts.heading,
  bodyFontFace: fonts.body,
  lang: "en-IN",
};

function addBg(slide, color = colors.smoke) {
  slide.background = { color };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.2,
    line: { color: colors.gold, transparency: 100 },
    fill: { color: colors.gold },
  });
}

function addHeader(slide, kicker, title, subtitle) {
  slide.addText(kicker, {
    x: 0.65,
    y: 0.45,
    w: 2.7,
    h: 0.3,
    fontFace: fonts.body,
    fontSize: 10,
    bold: true,
    color: colors.coral,
    charSpace: 1.5,
  });
  slide.addText(title, {
    x: 0.65,
    y: 0.78,
    w: 7.5,
    h: 0.8,
    fontFace: fonts.heading,
    fontSize: 24,
    bold: true,
    color: colors.ink,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.67,
      y: 1.5,
      w: 7.3,
      h: 0.75,
      fontFace: fonts.body,
      fontSize: 12,
      color: "4B5563",
      breakLine: false,
      margin: 0,
    });
  }
}

function pill(slide, text, x, y, w, fill, color = colors.ink) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.34,
    rectRadius: 0.08,
    line: { color: fill, transparency: 100 },
    fill: { color: fill },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.04,
    w: w - 0.16,
    h: 0.22,
    fontFace: fonts.body,
    fontSize: 9,
    bold: true,
    align: "center",
    color,
    margin: 0,
  });
}

function card(slide, { x, y, w, h, title, body, fill = colors.white, accent = colors.gold }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: accent, transparency: 55, pt: 1 },
    fill: { color: fill },
    shadow: { type: "outer", color: "D7D7D7", blur: 1, angle: 45, distance: 1, opacity: 0.15 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.12,
    h,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.34,
    h: 0.38,
    fontFace: fonts.heading,
    fontSize: 16,
    bold: true,
    color: colors.ink,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.22,
    y: y + 0.58,
    w: w - 0.34,
    h: h - 0.75,
    fontFace: fonts.body,
    fontSize: 11,
    color: "4B5563",
    valign: "top",
    margin: 0,
  });
}

function bulletList(items) {
  return items.map((text) => ({ text, options: { bullet: { indent: 14 } } }));
}

function addFooter(slide, text = "EEC B2C") {
  slide.addText(text, {
    x: 0.65,
    y: 7.03,
    w: 2.5,
    h: 0.2,
    fontFace: fonts.body,
    fontSize: 9,
    color: "6B7280",
    margin: 0,
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  slide.background = { color: colors.navy };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    line: { color: colors.navy, transparency: 100 },
    fill: { color: colors.navy },
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: 8.9,
    y: -1.2,
    w: 4.7,
    h: 4.7,
    line: { color: colors.gold, transparency: 100 },
    fill: { color: colors.gold, transparency: 82 },
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: -1.1,
    y: 4.5,
    w: 4.6,
    h: 4.2,
    line: { color: colors.coral, transparency: 100 },
    fill: { color: colors.coral, transparency: 75 },
  });
  slide.addText("EEC", {
    x: 0.72,
    y: 0.8,
    w: 1.4,
    h: 0.5,
    fontFace: fonts.heading,
    fontSize: 28,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  slide.addText("Electronic Educare", {
    x: 0.74,
    y: 1.25,
    w: 3.6,
    h: 0.35,
    fontFace: fonts.accent,
    fontSize: 20,
    color: colors.white,
    margin: 0,
  });
  slide.addText("B2C Brand & Product Presentation", {
    x: 0.72,
    y: 2.1,
    w: 5.8,
    h: 0.7,
    fontFace: fonts.heading,
    fontSize: 26,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  slide.addText("An AI-enabled learning, assessment, engagement, and commerce platform built for modern students, teachers, and academic operations.", {
    x: 0.74,
    y: 2.9,
    w: 5.8,
    h: 1.0,
    fontFace: fonts.body,
    fontSize: 14,
    color: "E5E7EB",
    margin: 0,
  });
  pill(slide, "AI-powered learning", 0.74, 4.15, 1.55, colors.gold);
  pill(slide, "Role-based platform", 2.4, 4.15, 1.72, colors.mint);
  pill(slide, "Digital commerce", 4.26, 4.15, 1.48, colors.lavender);
  slide.addImage({
    path: assets.landing,
    x: 8.05,
    y: 0.8,
    w: 4.4,
    h: 5.95,
    shadow: { type: "outer", color: "000000", blur: 2, angle: 45, distance: 2, opacity: 0.18 },
  });
  slide.addText("April 2026", {
    x: 0.74,
    y: 6.8,
    w: 2,
    h: 0.25,
    fontFace: fonts.body,
    fontSize: 10,
    color: "CBD5E1",
    margin: 0,
  });
}

// Slide 2
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "BRAND IDENTITY",
    "What EEC B2C stands for",
    "The original brand guide focuses on education, inclusion, guidance, and stronger learning relationships. This B2C version translates that vision into a product-led digital platform."
  );
  card(slide, {
    x: 0.7,
    y: 2.2,
    w: 4.0,
    h: 2.0,
    title: "Mission",
    body: "Deliver high-quality digital education with practical tools that help learners study better, practice smarter, and stay engaged over time.",
    accent: colors.gold,
  });
  card(slide, {
    x: 4.95,
    y: 2.2,
    w: 3.6,
    h: 2.0,
    title: "Vision",
    body: "Make learning more accessible, measurable, and motivating through technology, AI assistance, and guided user journeys.",
    accent: colors.coral,
  });
  card(slide, {
    x: 8.8,
    y: 2.2,
    w: 3.85,
    h: 2.0,
    title: "Brand Promise",
    body: "A single platform where content, assessment, commerce, and communication work together for a better learner experience.",
    accent: colors.teal,
  });
  slide.addText("Core values: clarity, accessibility, progress, trust, and continuous support.", {
    x: 0.72,
    y: 4.65,
    w: 8.3,
    h: 0.3,
    fontFace: fonts.serif,
    fontSize: 15,
    italic: true,
    color: colors.ink,
    margin: 0,
  });
  slide.addText("Reference brand cues carried forward", {
    x: 0.72,
    y: 5.28,
    w: 2.8,
    h: 0.3,
    fontFace: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    margin: 0,
  });
  pill(slide, "Oswald headlines", 0.72, 5.72, 1.45, colors.gray);
  pill(slide, "Nunito Sans body", 2.28, 5.72, 1.58, colors.sky);
  pill(slide, "Gold-led palette", 3.98, 5.72, 1.35, colors.gold);
  pill(slide, "Friendly, supportive voice", 5.45, 5.72, 2.0, colors.mint);
  addFooter(slide);
}

// Slide 3
{
  const slide = pptx.addSlide();
  addBg(slide, "FFFDF8");
  addHeader(
    slide,
    "PROBLEM",
    "Why the platform exists",
    "The project documentation consistently points to fragmented workflows, weak personalization, and missing monetization tools across traditional learning systems."
  );
  card(slide, {
    x: 0.72,
    y: 2.2,
    w: 2.95,
    h: 3.0,
    title: "Disconnected tools",
    body: "Learning content, tests, communication, and admin tasks often live in separate systems, creating friction for students and teams.",
    accent: colors.coral,
  });
  card(slide, {
    x: 3.93,
    y: 2.2,
    w: 2.95,
    h: 3.0,
    title: "Low personalization",
    body: "Learners need faster feedback, self-practice, and guided progression rather than static one-size-fits-all experiences.",
    accent: colors.gold,
  });
  card(slide, {
    x: 7.14,
    y: 2.2,
    w: 2.95,
    h: 3.0,
    title: "Weak engagement",
    body: "Notifications, chat, gamified flows, and progress visibility are often missing, reducing retention and daily usage.",
    accent: colors.teal,
  });
  card(slide, {
    x: 10.35,
    y: 2.2,
    w: 2.25,
    h: 3.0,
    title: "No business layer",
    body: "Digital learning businesses also need packages, subscriptions, paid materials, wallet systems, and reporting.",
    accent: colors.plum,
  });
  addFooter(slide);
}

// Slide 4
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "SOLUTION",
    "A unified B2C learning ecosystem",
    "EEC B2C combines product experience, academic workflows, AI utilities, and commerce modules into one modular web platform."
  );
  card(slide, {
    x: 0.72,
    y: 2.1,
    w: 2.9,
    h: 1.85,
    title: "Learn",
    body: "Structured content, study materials, stage-based access, and public-facing educational pages.",
    accent: colors.gold,
    fill: "FFFCF0",
  });
  card(slide, {
    x: 3.86,
    y: 2.1,
    w: 2.9,
    h: 1.85,
    title: "Assess",
    body: "Question bank, exams, attempts, results, leaderboards, and self-study scoring.",
    accent: colors.coral,
    fill: "FFF5F5",
  });
  card(slide, {
    x: 7.0,
    y: 2.1,
    w: 2.9,
    h: 1.85,
    title: "Engage",
    body: "Notifications, push alerts, global chat, and mind-training interactions.",
    accent: colors.teal,
    fill: "F2FFFB",
  });
  card(slide, {
    x: 10.14,
    y: 2.1,
    w: 2.45,
    h: 1.85,
    title: "Monetize",
    body: "Packages, subscriptions, paid materials, wallet, coins, and gift card flows.",
    accent: colors.plum,
    fill: "F7F3FF",
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72,
    y: 4.4,
    w: 11.9,
    h: 1.75,
    rectRadius: 0.14,
    line: { color: colors.gray, pt: 1 },
    fill: { color: colors.white },
  });
  slide.addText("Value proposition", {
    x: 0.95,
    y: 4.62,
    w: 2.2,
    h: 0.3,
    fontFace: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    margin: 0,
  });
  slide.addText(bulletList([
    "One platform for public discovery, student learning, teacher contribution, and admin control.",
    "AI-assisted question workflows from PDF content for both admin and self-study use cases.",
    "Built-in digital business model through packages, subscriptions, and secure material purchase flows.",
  ]), {
    x: 1.0,
    y: 5.0,
    w: 10.8,
    h: 0.95,
    fontFace: fonts.body,
    fontSize: 12,
    color: "374151",
    breakLine: false,
    paraSpaceAfterPt: 8,
  });
  addFooter(slide);
}

// Slide 5
{
  const slide = pptx.addSlide();
  addBg(slide, "FAFBFF");
  addHeader(
    slide,
    "TARGET AUDIENCE",
    "Role-based experience for every stakeholder",
    "The codebase and documentation define four primary user groups, each with its own routes, permissions, and product value."
  );
  const items = [
    ["Public", "Discovers the brand, browses packages, reads content pages, and subscribes to updates.", colors.gold],
    ["Student", "Learns, practices, buys materials, activates packages, tracks results, and joins the engagement loops.", colors.coral],
    ["Teacher", "Supports academic operations, manages content-linked tasks, and participates in verified workflows.", colors.teal],
    ["Admin", "Runs the platform end-to-end across users, academics, commerce, CMS, notifications, and reporting.", colors.plum],
  ];
  items.forEach(([title, body, accent], idx) => {
    const y = 2.15 + idx * 1.15;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.82,
      y,
      w: 11.75,
      h: 0.88,
      rectRadius: 0.08,
      line: { color: accent, transparency: 55, pt: 1 },
      fill: { color: colors.white },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.02,
      y: y + 0.18,
      w: 1.35,
      h: 0.5,
      rectRadius: 0.1,
      line: { color: accent, transparency: 100 },
      fill: { color: accent },
    });
    slide.addText(title, {
      x: 1.12,
      y: y + 0.28,
      w: 1.1,
      h: 0.2,
      fontFace: fonts.heading,
      fontSize: 14,
      color: colors.ink,
      align: "center",
      margin: 0,
    });
    slide.addText(body, {
      x: 2.65,
      y: y + 0.2,
      w: 9.45,
      h: 0.45,
      fontFace: fonts.body,
      fontSize: 12,
      color: "374151",
      margin: 0,
    });
  });
  addFooter(slide);
}

// Slide 6
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "FEATURE SYSTEM",
    "The platform is broad, but the story is simple",
    "EEC B2C is organized around a set of interconnected modules that cover content, assessment, engagement, and operations."
  );
  const features = [
    ["Authentication", "JWT auth, profiles, password reset", colors.gold, 0.72, 2.15],
    ["Academic Masters", "Boards, classes, subjects, topics", colors.teal, 3.95, 2.15],
    ["Question Bank", "Multi-type question creation and control", colors.coral, 7.18, 2.15],
    ["Exams & Results", "Attempts, analytics, rank, leaderboard", colors.plum, 10.41, 2.15],
    ["Study Materials", "Upload, secure access, paid/free flows", colors.gold, 0.72, 4.2],
    ["Subscriptions", "Packages, stage unlocks, lifecycle management", colors.coral, 3.95, 4.2],
    ["Notifications & Chat", "Realtime messaging and role-targeted alerts", colors.teal, 7.18, 4.2],
    ["CMS & Promotion", "Public content control and auto-promotion engine", colors.plum, 10.41, 4.2],
  ];
  features.forEach(([title, body, accent, x, y]) => {
    card(slide, { x, y, w: 2.55, h: 1.55, title, body, accent, fill: colors.white });
  });
  addFooter(slide);
}

// Slide 7
{
  const slide = pptx.addSlide();
  addBg(slide, "FEFFFD");
  addHeader(
    slide,
    "AI LAYER",
    "From PDF content to practice-ready questions",
    "The original brand guide emphasizes AI as a differentiator. In the B2C product, that becomes a concrete workflow rather than a generic promise."
  );
  card(slide, {
    x: 0.72,
    y: 2.2,
    w: 5.35,
    h: 3.55,
    title: "Admin AI question generation",
    body: "Upload a PDF, extract text, generate structured questions, review them, and optionally save them into the question bank.\n\nThis supports faster academic content creation and expands the assessment pipeline without manual authoring alone.",
    accent: colors.gold,
    fill: "FFFCF2",
  });
  card(slide, {
    x: 6.35,
    y: 2.2,
    w: 3.0,
    h: 3.55,
    title: "Self-study",
    body: "Students and authenticated users can upload content, generate practice questions, submit answers, and track scores and stats.",
    accent: colors.teal,
    fill: "F1FFFB",
  });
  card(slide, {
    x: 9.62,
    y: 2.2,
    w: 2.98,
    h: 3.55,
    title: "Business impact",
    body: "AI improves content velocity, raises engagement, supports differentiated learning, and strengthens the product story for a modern EdTech audience.",
    accent: colors.coral,
    fill: "FFF6F6",
  });
  addFooter(slide);
}

// Slide 8
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "COMMERCE",
    "A learning platform with a working revenue engine",
    "Unlike a basic LMS, EEC B2C includes monetization and retention features directly inside the product."
  );
  slide.addText(bulletList([
    "Paid and free study material flows with secure PDF access control.",
    "Package catalog and subscription system with stage unlocking logic.",
    "Razorpay integration for payment order creation and verification.",
    "Wallet, points, redemption, and gift card inventory management.",
    "Purchase history, invoices, subscription reporting, and admin oversight.",
  ]), {
    x: 0.82,
    y: 2.2,
    w: 5.4,
    h: 2.55,
    fontFace: fonts.body,
    fontSize: 13,
    color: "374151",
    paraSpaceAfterPt: 10,
  });
  slide.addImage({
    path: assets.dashboard,
    x: 6.6,
    y: 1.95,
    w: 5.7,
    h: 4.55,
    rounding: true,
    shadow: { type: "outer", color: "9CA3AF", blur: 2, angle: 45, distance: 1, opacity: 0.22 },
  });
  pill(slide, "Starter Scout", 0.84, 5.3, 1.2, colors.gray);
  pill(slide, "Master Scholar", 2.12, 5.3, 1.4, colors.sky);
  pill(slide, "Adventure Team", 3.62, 5.3, 1.42, colors.gold);
  addFooter(slide);
}

// Slide 9
{
  const slide = pptx.addSlide();
  addBg(slide, "FCFCFC");
  addHeader(
    slide,
    "ARCHITECTURE",
    "Built as a modular MERN-style system",
    "The implementation is web-first, role-driven, and designed to keep features extensible across public pages, dashboards, APIs, and realtime communication."
  );
  const cols = [
    [0.8, "Experience Layer", "React, Vite, React Router, TailwindCSS, Framer Motion, Socket.IO Client", colors.gold],
    [4.45, "Application Layer", "Node.js, Express, JWT guards, module routes, scheduling, media and payment services", colors.coral],
    [8.1, "Data & Services", "MongoDB, Cloudinary, Razorpay, Web Push, Email, local AI question generation service", colors.teal],
  ];
  cols.forEach(([x, title, body, accent]) => {
    card(slide, { x, y: 2.25, w: 3.15, h: 2.6, title, body, accent, fill: colors.white });
  });
  slide.addShape(pptx.ShapeType.chevron, {
    x: 3.9,
    y: 3.1,
    w: 0.4,
    h: 0.55,
    line: { color: colors.gray, transparency: 100 },
    fill: { color: colors.gray },
  });
  slide.addShape(pptx.ShapeType.chevron, {
    x: 7.55,
    y: 3.1,
    w: 0.4,
    h: 0.55,
    line: { color: colors.gray, transparency: 100 },
    fill: { color: colors.gray },
  });
  slide.addText("Operational strengths: API-first structure, protected routes, environment-driven configuration, and scalable domain separation.", {
    x: 0.83,
    y: 5.45,
    w: 10.8,
    h: 0.5,
    fontFace: fonts.serif,
    fontSize: 15,
    italic: true,
    color: colors.ink,
    margin: 0,
  });
  addFooter(slide);
}

// Slide 10
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "USER JOURNEY",
    "A simple path from discovery to retention",
    "The B2C experience is designed to bring users from public awareness into recurring learning and purchase behavior."
  );
  const steps = [
    ["01", "Discover", "Public pages, brand messaging, package browsing, newsletter sign-up", colors.coral, 0.82],
    ["02", "Join", "Register, login, profile setup, role-based dashboard entry", colors.gold, 3.3],
    ["03", "Learn", "Study materials, exams, self-study, rankings, and subject progression", colors.teal, 5.78],
    ["04", "Upgrade", "Buy materials, activate plans, unlock stages, use wallet and offers", colors.plum, 8.26],
    ["05", "Return", "Notifications, push alerts, chat, fresh content, and habit loops", colors.coral, 10.74],
  ];
  steps.forEach(([num, title, body, accent, x]) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: 2.55,
      w: 0.72,
      h: 0.72,
      line: { color: accent, pt: 1.5 },
      fill: { color: colors.white },
    });
    slide.addText(num, {
      x: x + 0.14,
      y: 2.73,
      w: 0.44,
      h: 0.18,
      fontFace: fonts.heading,
      fontSize: 16,
      color: accent,
      align: "center",
      margin: 0,
    });
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.72,
      y: 2.91,
      w: 1.75,
      h: 0,
      line: { color: colors.gray, pt: 2, transparency: 15 },
    });
    slide.addText(title, {
      x: x - 0.06,
      y: 3.55,
      w: 1.0,
      h: 0.3,
      fontFace: fonts.heading,
      fontSize: 14,
      color: colors.ink,
      align: "center",
      margin: 0,
    });
    slide.addText(body, {
      x: x - 0.52,
      y: 3.98,
      w: 1.95,
      h: 1.0,
      fontFace: fonts.body,
      fontSize: 10.5,
      color: "4B5563",
      align: "center",
      margin: 0,
    });
  });
  addFooter(slide);
}

// Slide 11
{
  const slide = pptx.addSlide();
  addBg(slide, "FFFDFB");
  addHeader(
    slide,
    "PRODUCT PROOF",
    "The current project already has meaningful implementation depth",
    "This is not a concept-only brand story. The repository documents a substantial working platform."
  );
  const stats = [
    ["304", "tracked source and asset files", colors.gold],
    ["30", "backend route modules", colors.coral],
    ["25", "database models", colors.teal],
    ["4", "core user roles", colors.plum],
  ];
  stats.forEach(([value, label, accent], idx) => {
    const x = 0.82 + idx * 3.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.2,
      w: 2.6,
      h: 1.8,
      rectRadius: 0.12,
      line: { color: accent, transparency: 50, pt: 1 },
      fill: { color: colors.white },
    });
    slide.addText(value, {
      x: x + 0.15,
      y: 2.48,
      w: 2.3,
      h: 0.45,
      fontFace: fonts.heading,
      fontSize: 24,
      bold: true,
      color: accent,
      align: "center",
      margin: 0,
    });
    slide.addText(label, {
      x: x + 0.16,
      y: 3.06,
      w: 2.28,
      h: 0.55,
      fontFace: fonts.body,
      fontSize: 11,
      color: "374151",
      align: "center",
      margin: 0,
    });
  });
  slide.addText("Key integrations", {
    x: 0.82,
    y: 4.55,
    w: 2.0,
    h: 0.3,
    fontFace: fonts.heading,
    fontSize: 16,
    color: colors.ink,
    margin: 0,
  });
  pill(slide, "Razorpay", 0.84, 5.0, 1.05, colors.gold);
  pill(slide, "Cloudinary", 2.0, 5.0, 1.15, colors.sky);
  pill(slide, "Socket.IO", 3.28, 5.0, 1.05, colors.mint);
  pill(slide, "Web Push", 4.45, 5.0, 1.02, colors.lavender);
  pill(slide, "Email", 5.58, 5.0, 0.82, colors.gray);
  pill(slide, "Local AI service", 6.53, 5.0, 1.4, colors.coral, colors.white);
  addFooter(slide);
}

// Slide 12
{
  const slide = pptx.addSlide();
  addBg(slide);
  addHeader(
    slide,
    "SCREEN STORY",
    "Public personality plus dashboard depth",
    "The visual system balances a warm, approachable landing experience with practical dashboard workflows for package and admin management."
  );
  slide.addImage({
    path: assets.landing,
    x: 0.9,
    y: 2.0,
    w: 3.0,
    h: 4.8,
    shadow: { type: "outer", color: "9CA3AF", blur: 2, angle: 45, distance: 1, opacity: 0.22 },
  });
  slide.addImage({
    path: assets.dashboard,
    x: 4.35,
    y: 2.0,
    w: 7.95,
    h: 4.8,
    shadow: { type: "outer", color: "9CA3AF", blur: 2, angle: 45, distance: 1, opacity: 0.22 },
  });
  addFooter(slide);
}

// Slide 13
{
  const slide = pptx.addSlide();
  addBg(slide, "FBFCFE");
  addHeader(
    slide,
    "RISKS & NEXT ITERATION",
    "Where the product can get stronger",
    "The documentation also highlights a few production-hardening opportunities that matter for the brand story."
  );
  card(slide, {
    x: 0.75,
    y: 2.15,
    w: 3.88,
    h: 2.65,
    title: "Security tightening",
    body: "Some CMS update routes and teacher CRUD routes are noted as not consistently protected in the current implementation and should be guarded before broader rollout.",
    accent: colors.coral,
    fill: "FFF6F6",
  });
  card(slide, {
    x: 4.72,
    y: 2.15,
    w: 3.88,
    h: 2.65,
    title: "Analytics depth",
    body: "There is room to expand recommendation logic, learner insights, progress prediction, and advanced reporting across roles.",
    accent: colors.gold,
    fill: "FFFCF2",
  });
  card(slide, {
    x: 8.69,
    y: 2.15,
    w: 3.88,
    h: 2.65,
    title: "Experience upgrades",
    body: "Future iterations can push stronger proctoring, more gamification, richer content intelligence, and more polished conversion funnels.",
    accent: colors.teal,
    fill: "F1FFFB",
  });
  addFooter(slide);
}

// Slide 14
{
  const slide = pptx.addSlide();
  slide.background = { color: colors.navy };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.75,
    y: 0.72,
    w: 11.85,
    h: 6.0,
    line: { color: colors.gold, pt: 1.25, transparency: 30 },
    fill: { color: "182033" },
  });
  slide.addText("EEC B2C", {
    x: 1.2,
    y: 1.45,
    w: 3.3,
    h: 0.6,
    fontFace: fonts.heading,
    fontSize: 28,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  slide.addText("From brand intent to product reality", {
    x: 1.22,
    y: 2.15,
    w: 4.7,
    h: 0.45,
    fontFace: fonts.serif,
    fontSize: 18,
    italic: true,
    color: colors.white,
    margin: 0,
  });
  slide.addText("The new B2C deck keeps the educational optimism of the original brand guide and reframes it around a working platform: AI-assisted learning, role-based workflows, monetization, and scalable growth.", {
    x: 1.22,
    y: 2.95,
    w: 5.45,
    h: 1.3,
    fontFace: fonts.body,
    fontSize: 14,
    color: "E5E7EB",
    margin: 0,
  });
  pill(slide, "Learning", 1.22, 4.75, 0.95, colors.gold);
  pill(slide, "Assessment", 2.28, 4.75, 1.1, colors.coral);
  pill(slide, "Engagement", 3.5, 4.75, 1.05, colors.mint);
  pill(slide, "Commerce", 4.67, 4.75, 0.98, colors.lavender);
  slide.addText("Electronic Educare", {
    x: 1.24,
    y: 5.55,
    w: 2.8,
    h: 0.35,
    fontFace: fonts.accent,
    fontSize: 18,
    color: colors.white,
    margin: 0,
  });
  slide.addImage({
    path: assets.dashboard,
    x: 7.3,
    y: 1.35,
    w: 4.55,
    h: 3.6,
    shadow: { type: "outer", color: "000000", blur: 2, angle: 45, distance: 2, opacity: 0.24 },
  });
  slide.addText("Prepared from the current EEC workspace and the uploaded reference brand guide.", {
    x: 7.35,
    y: 5.35,
    w: 4.4,
    h: 0.45,
    fontFace: fonts.body,
    fontSize: 10.5,
    color: "CBD5E1",
    align: "center",
    margin: 0,
  });
}

const outPath = path.join(root, "EEC_B2C_Brand_Guide_Presentation.pptx");
await pptx.writeFile({ fileName: outPath });
console.log(`Created ${outPath}`);
