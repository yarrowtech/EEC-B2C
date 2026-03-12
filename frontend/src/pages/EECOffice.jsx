// src/pages/EECOffice.jsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function EECOffice() {
  const API = import.meta.env.VITE_API_URL || "";
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/office`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to load contact-us page", e);
      }
    })();
  }, [API]);

  const mapsEmbed = data?.mapEmbedUrl || "";
  const mapsDir = data?.mapDirectionsUrl || "";
  const contacts =
    Array.isArray(data?.contacts) && data.contacts.length
      ? data.contacts
      : [
          { id: "address", title: "Office Address", value: data?.address || "", type: "address" },
          { id: "phone", title: "Contact Number", value: data?.phone || "", type: "phone" },
          { id: "email", title: "Email", value: data?.email || "", type: "email" },
        ].filter((c) => c.value);

  const addressValue = contacts.find((c) => c.type === "address")?.value || data?.address || "";
  const phoneValue = contacts.find((c) => c.type === "phone")?.value || data?.phone || "";
  const emailValue = contacts.find((c) => c.type === "email")?.value || data?.email || "";

  return (
    <div className="bg-[#fffdf7] text-[#102133] selection:bg-yellow-200/60">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#fffef5] to-[#fff5e0] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-stretch gap-8 overflow-hidden rounded-[32px] bg-[#102946] text-white shadow-[0_25px_60px_rgba(12,26,46,0.35)] md:grid-cols-2">
            <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]">
                {data?.hero?.badge || "Visit Us"}
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
                {data?.hero?.title || "Welcome to the EEC Office!"}
              </h1>
              <p className="mt-4 text-lg text-white/90">{data?.hero?.subtitle || "Located in Kolkata, our workspace is designed for collaboration and creativity."}</p>
              <p className="mt-4 text-sm text-white/70">
                Drop by, collaborate with our team, or simply say hello. We’re always excited to meet fellow explorers.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  className="rounded-full bg-[#ffd861] px-6 py-3 text-sm font-semibold text-[#1d2430] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffe07d]"
                  onClick={() => document.querySelector("#find-us")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Find Us
                </button>
                {mapsDir ? (
                  <a
                    href={mapsDir}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Get Directions
                  </a>
                ) : null}
              </div>
            </div>
            <div className="relative min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-tl from-black/20 to-transparent" />
              <img src={data?.hero?.image || "/office.jpg"} alt="EEC Office" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute -right-12 top-10 hidden h-32 w-32 rounded-full bg-white/10 blur-3xl md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Primary contact cards */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-[#0e1f32]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Let’s stay connected
          </h2>
          <p className="mt-3 text-base text-[#4a5971]">
            Reach us through any of the channels below. We respond quickly because every inquiry matters.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              icon: <MapPin className="h-6 w-6" />,
              title: "Office Address",
              value: addressValue || "Address not available",
            },
            {
              icon: <Phone className="h-6 w-6" />,
              title: "Call Us",
              value: phoneValue || "Phone not available",
              link: phoneValue ? `tel:${phoneValue}` : undefined,
            },
            {
              icon: <Mail className="h-6 w-6" />,
              title: "Email",
              value: emailValue || "Email not available",
              link: emailValue ? `mailto:${emailValue}` : undefined,
            },
          ].map((card) => (
            <div key={card.title} className="rounded-[28px] border border-[#edf0f5] bg-[#fefbf5] p-6 shadow-[0_15px_40px_rgba(14,31,50,0.08)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#f4a259] shadow">{card.icon}</div>
              <h3 className="text-xl font-semibold text-[#14263b]">{card.title}</h3>
              {card.link ? (
                <a href={card.link} className="mt-2 block text-sm font-semibold text-[#27405f] hover:underline">
                  {card.value}
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#4a5971]">{card.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Map + CTA */}
      <section id="find-us" className="bg-[#fff8ee] px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div className="rounded-[32px] bg-white p-4 shadow-[0_30px_60px_rgba(225,173,117,0.45)]">
            <div className="overflow-hidden rounded-[24px] border border-[#ffe4c3]">
              {mapsEmbed ? (
                <iframe
                  className="h-[320px] w-full border-0"
                  src={mapsEmbed}
                  allowFullScreen
                  loading="lazy"
                  title="EEC Office Location"
                />
              ) : (
                <div className="grid h-[320px] place-items-center text-[#9f9f9f]">Map not configured yet</div>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#f28c4c]">Plan a visit</span>
            <h2 className="mt-4 text-3xl font-bold text-[#0e1f32]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
              Where ideas and families meet
            </h2>
            <p className="mt-4 text-base text-[#4a5971]">
              Step inside to experience how we collaborate with parents, educators, partners, and mentors. Every conversation begins with a warm welcome.
            </p>
            <div className="mt-6 space-y-3 text-sm font-semibold text-[#28374f]">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ffe5c7] text-[#f28c4c]">•</span>
                Guided office tours available on request.
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#dff7f3] text-[#3ab7a3]">•</span>
                Dedicated collaboration corners for partners.
              </div>
            </div>
            {mapsDir ? (
              <a
                href={mapsDir}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center rounded-full bg-[#102133] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* Detailed contacts */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6c7da4]">More contacts</span>
          <h2 className="mt-3 text-3xl font-bold text-[#0f1f32]" style={{ fontFamily: "'Balsamiq Sans', cursive" }}>
            Dedicated touchpoints for every need
          </h2>
          <p className="mt-4 text-base text-[#4c5b73]">
            Choose the department or service best suited for your query. Each team has a direct channel so questions get answered faster.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
          {contacts.map((info, i) => (
            <motion.div
              key={info.id || `${info.title}-${i}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="rounded-[28px] border border-[#eef0f5] bg-[#fefbf5] p-6 text-left shadow-[0_18px_40px_rgba(15,31,50,0.07)]"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#657398]">
                {info.type === "phone" ? "Phone" : info.type === "email" ? "Email" : "Address"}
              </div>
              <h4 className="mt-3 text-lg font-semibold text-[#15253c]">{info.title}</h4>
              <p className="mt-2 text-sm text-[#4b5b78]">{info.value}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
