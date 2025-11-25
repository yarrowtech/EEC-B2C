// src/pages/EECOffice.jsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function EECOffice() {
  const mapsEmbed =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.5105918990157!2d88.34842407405898!3d22.559998933434503!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a027708e4bbaea9%3A0xcac9c767f56f9985!2s19B%2C%20Jawaharlal%20Nehru%20Rd%2C%20New%20Market%20Area%2C%20Dharmatala%2C%20Taltala%2C%20Kolkata%2C%20West%20Bengal%20700087!5e0!3m2!1sen!2sin!4v1728293602394!5m2!1sen!2sin";

  const mapsDir =
    "https://www.google.com/maps/dir/?api=1&destination=19B%20Jawaharlal%20Nehru%20Rd%2C%20Esplanade%2C%20Kolkata%2C%20700087";

  return (
    <div className="overflow-x-hidden bg-white text-blue-950 selection:bg-yellow-200/60">
      {/* =========================
          HERO (image + bluish overlay + curve)
      ========================== */}
      <section className="relative flex h-[72vh] w-full items-center justify-center overflow-hidden bg-[url('/office.jpg')] bg-cover bg-center">
        {/* overlays */}
        <div className="absolute inset-0 bg-blue-950/55" />
        <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-sky-400/15 via-indigo-400/10 to-amber-300/10" />
        {/* soft blobs */}
        <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            Kolkata • Collaboration-first workspace
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight drop-shadow md:text-6xl">
            Welcome to the <span className="text-yellow-300">EEC</span> Office!
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-blue-100/90">
            Located in Kolkata, our workspace is designed for collaboration and creativity.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#find-us"
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 px-5 py-2 text-sm font-semibold text-blue-950 shadow-md ring-1 ring-yellow-300/60 transition hover:shadow-lg hover:saturate-[1.1] active:scale-[.98]"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#find-us")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Find Us
            </a>
            <a
              href={mapsDir}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Get Directions
            </a>
          </div>
        </motion.div>

        {/* curve divider */}
        <svg className="pointer-events-none absolute -bottom-[1px] left-0 w-full" viewBox="0 0 1440 120" aria-hidden>
          <path
            fill="#ffffff"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,80C672,85,768,107,864,117.3C960,128,1056,128,1152,117.3C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </section>

      {/* =========================
          WORKSPACE (image + text)
      ========================== */}
      <section className="bg-blue-50/40 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 md:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative flex-1"
          >
            <img
              src="/office1.jpg"
              alt="EEC Office Workspace"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <h2 className="text-3xl font-semibold">Our Collaborative Workspace</h2>
            <div className="mb-4 mt-3 h-[3px] w-28 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              At EEC, we believe a great environment fosters innovation. Our modern office in Kolkata
              features flexible workstations, a lounge area, and wellness programs to promote work-life
              balance. We are committed to creating an inclusive and productive culture for our team.
            </p>

            {/* mini chips */}
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              {["Focus rooms", "Wellness corner", "Collab spaces", "Fast Wi-Fi"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-blue-900/80 shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================
          FIND US (map + copy + CTA)
      ========================== */}
      <section id="find-us" className="py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold">Find Us</h2>
          <div className="mx-auto mt-3 h-[3px] w-28 bg-yellow-400" />
          <p className="mx-auto mt-4 max-w-2xl text-blue-900/90">
            We are located in the heart of Kolkata. Visit us at our office or get in touch with us
            through the contact details below.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Map */}
            <div className="md:col-span-2">
              <div className="aspect-video w-full overflow-hidden rounded-3xl border border-blue-100 shadow-lg">
                <iframe
                  className="h-full w-full border-0"
                  src={mapsEmbed}
                  allowFullScreen
                  loading="lazy"
                  title="EEC Office Location"
                />
              </div>
            </div>

            {/* Quick contact card */}
            <div className="flex flex-col justify-between rounded-3xl border border-blue-100/60 bg-white p-6 shadow-lg">
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-blue-700" />
                  <p className="text-sm text-blue-900/90">
                    123 EEC, 19B Jawaharlal Nehru Marg, Esplanade, Kolkata, West Bengal 700087
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-700" />
                  <a href="tel:+919830590929" className="text-sm text-blue-900/90 hover:underline">
                    +91 9830590929
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-700" />
                  <a
                    href="mailto:contact@eeclearning.com"
                    className="text-sm text-blue-900/90 hover:underline"
                  >
                    contact@eeclearning.com
                  </a>
                </div>
              </div>
              <a
                href={mapsDir}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-[.98]"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CONTACT CARDS (glassy)
      ========================== */}
      <section className="bg-blue-50/40 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 text-center md:grid-cols-3">
          {[
            {
              title: "Office Address",
              text:
                "123 EEC, 19B Jawaharlal Nehru Marg, Esplanade, Kolkata, West Bengal 700087",
              icon: <MapPin className="h-5 w-5" />,
            },
            { title: "Contact Number", text: "+91 9830590929", icon: <Phone className="h-5 w-5" /> },
            { title: "Email", text: "contact@eeclearning.com", icon: <Mail className="h-5 w-5" /> },
          ].map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="rounded-3xl border border-blue-100/60 bg-white/90 p-6 shadow-lg backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-900">
                {info.icon}
                Info
              </div>
              <h4 className="mb-2 text-xl font-semibold">{info.title}</h4>
              <p className="text-blue-900/90">{info.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
