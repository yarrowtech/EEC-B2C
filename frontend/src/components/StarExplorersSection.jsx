import React from "react";
import feedbackTestimonials from "../data/feedbackTestimonials.json";

const CARD_COLORS = ["#FF6B6B", "#4ECDC4", "#6C63FF", "#FF9F1C", "#00A7E1"];
const MIN_FEEDBACK_LENGTH = 30;

function getRoleIcon(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("parent")) return "family_restroom";
  if (value.includes("teacher")) return "school";
  return "person";
}

function Stars({ rating = 5 }) {
  return (
    <div className="flex items-center gap-1 text-[#FFD23F] mb-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="material-symbols-outlined fill-icon">
          {index < rating ? "star" : "star_rate"}
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ item, color }) {
  return (
    <article
      className="bg-white p-8 rounded-[2.2rem] shadow-xl relative border-t-8 w-[320px] md:w-[360px] shrink-0"
      style={{ borderTopColor: color }}
    >
      <div className="absolute top-4 left-5 opacity-20" style={{ color }}>
        <span className="material-symbols-outlined text-7xl">format_quote</span>
      </div>
      <Stars rating={item.rating} />
      <p className="text-slate-600 mb-8 font-medium italic leading-relaxed line-clamp-6">
        &quot;{item.feedback}&quot;
      </p>
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}33`, color }}
        >
          <span className="material-symbols-outlined text-3xl">{getRoleIcon(item.role)}</span>
        </div>
        <div>
          <div className="font-bold text-lg text-slate-900">{item.name}</div>
          <div className="text-xs text-slate-400">
            {item.role}
            {item.schoolName ? `, ${item.schoolName}` : ""}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StarExplorersSection() {
  const testimonials = (() => {
    const seenSchools = new Set();
    return (feedbackTestimonials || [])
      .filter((item) => {
        const rating = Number(item?.rating || 0);
        const feedbackLength = String(item?.feedback || "").trim().length;
        return (
          item?.consent === true &&
          rating >= 4 &&
          rating <= 5 &&
          feedbackLength >= MIN_FEEDBACK_LENGTH &&
          item?.name &&
          item?.schoolName
        );
      })
      .sort(
        (a, b) =>
          String(b.feedback || "").trim().length -
          String(a.feedback || "").trim().length
      )
      .filter((item) => {
        const schoolKey = String(item.schoolName).trim().toLowerCase();
        if (seenSchools.has(schoolKey)) return false;
        seenSchools.add(schoolKey);
        return true;
      });
  })();
  const scrollingItems = [...testimonials, ...testimonials];

  return (
    <section className="py-24 bg-[#FEF4E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-4xl lg:text-5xl font-bold text-center mb-14 text-slate-900"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          Stories from our <span className="text-[#6C63FF]">Star Explorers</span>
        </h2>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-14 z-10 bg-gradient-to-r from-[#FEF4E8] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-14 z-10 bg-gradient-to-l from-[#FEF4E8] to-transparent" />

          {testimonials.length > 0 ? (
            <div className="flex gap-6 w-max auto-scroll-testimonials hover:[animation-play-state:paused]">
              {scrollingItems.map((item, index) => (
                <TestimonialCard
                  key={`${item.id}-${index}`}
                  item={item}
                  color={CARD_COLORS[index % CARD_COLORS.length]}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-10">No testimonials available.</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes testimonials-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .auto-scroll-testimonials {
          animation: testimonials-scroll 20s linear infinite;
        }
      `}</style>
    </section>
  );
}
