import { useState } from "react";
import { Code2, Star, Zap } from "lucide-react";

function LinkedInSVG({ size = 15 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.985V9h3.102v1.561h.046c.432-.818 1.487-1.681 3.059-1.681 3.27 0 3.875 2.152 3.875 4.951v6.621zM5.337 7.433a1.8 1.8 0 1 1 0-3.601 1.8 1.8 0 0 1 0 3.601zM6.924 20.452H3.747V9h3.177v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
    );
}

/* ─────────────────────────────────────────────────────────────
   DEVELOPER DATA  –  fill in the real LinkedIn profile slugs
   e.g.  linkedin: "https://www.linkedin.com/in/raktim-das-xyz/"
   The profile photo is fetched live from LinkedIn via unavatar.io
   so it automatically reflects the latest LinkedIn profile picture.
───────────────────────────────────────────────────────────────*/
const developers = [
    {
        name: "Raktim Maity",
        role: "Full Stack Developer",
        bio: "Crafting seamless end-to-end experiences with a love for clean, scalable architecture.",
        skills: ["React", "Node.js", "MongoDB"],
        linkedin: "https://www.linkedin.com/in/raktim-maity-0a558824a/",   // ← add your slug
        photo: "https://media.licdn.com/dms/image/v2/D5603AQEc0R1raxinow/profile-displayphoto-scale_200_200/B56ZvK6EmvKwAc-/0/1768635788536?e=1775088000&v=beta&t=u61sygP8B64TczzQm9iFQdYZiwS-E4DZ0yzscGXLU3A",
        cardColor: "from-violet-500 to-indigo-600",
        badgeColor: "bg-violet-100 text-violet-700",
    },
    {
        name: "Koushik Bala",
        role: "Frontend Developer",
        bio: "Turning complex designs into delightful pixel-perfect interfaces that users love.",
        skills: ["React", "Tailwind CSS", "Figma"],
        linkedin: "https://www.linkedin.com/in/koushikbalasxc/",   // ← add your slug
        photo: "https://media.licdn.com/dms/image/v2/D4D03AQFdeu83DCmGqg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1705517249117?e=1775088000&v=beta&t=HsPlqrfXBYRDmdMRdh62ErX-Dr5CQryFEEXRKn5bbfY",
        cardColor: "from-pink-500 to-rose-600",
        badgeColor: "bg-pink-100 text-pink-700",
    },
    {
        name: "Santu Pramanik",
        role: "Backend Developer",
        bio: "Building robust APIs and data pipelines that power the platform behind the scenes.",
        skills: ["Node.js", "Express", "PostgreSQL"],
        linkedin: "https://www.linkedin.com/in/santu-pramanik-23-sp/",   // ← add your slug
        photo: "https://media.licdn.com/dms/image/v2/D5603AQF4HKC5DAkMmQ/profile-displayphoto-scale_200_200/B56ZxmOpzeHoAY-/0/1771241649677?e=1775088000&v=beta&t=y6gK5NfesXQ1ZJTUBCDCx1Saib7OOzwtjiF9bc0QnO4",
        cardColor: "from-emerald-500 to-teal-600",
        badgeColor: "bg-emerald-100 text-emerald-700",
    },
];

/* ── helpers ── */
function getLinkedInSlug(url = "") {
    const m = url.match(/linkedin\.com\/in\/([^/?#]+)/);
    const slug = m ? m[1].replace(/\/$/, "") : "";
    return slug.length > 0 ? slug : null;
}

/* ── Profile photo: explicit photo URL -> LinkedIn -> coloured initials ── */
function LinkedInPhoto({ name, linkedin, cardColor }) {
    const [errorStage, setErrorStage] = useState(0);
    const slug = getLinkedInSlug(linkedin);
    const explicitPhoto = developers.find((d) => d.name === name)?.photo || "";
    const linkedInPhoto = slug ? `https://unavatar.io/linkedin/${slug}` : "";

    let src = "";
    if (errorStage === 0 && explicitPhoto) src = explicitPhoto;
    else if (errorStage <= 1 && linkedInPhoto) src = linkedInPhoto;

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                referrerPolicy="no-referrer"
                onError={() => setErrorStage((s) => s + 1)}
                className="w-full h-full object-cover"
            />
        );
    }
    /* Initials fallback */
    return (
        <div className={`w-full h-full bg-linear-to-br ${cardColor} flex items-center justify-center`}>
            <span className="text-4xl font-black text-white/90 select-none">
                {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
        </div>
    );
}

/* ── Single developer card ── */
function DeveloperCard({ dev }) {
    return (
        <article className="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-slate-100">

            {/* Coloured banner */}
            <div className={`h-28 bg-linear-to-r ${dev.cardColor} relative`}>
                {/* subtle pattern dots */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            </div>

            {/* Avatar — overlaps banner */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2">
                <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-slate-100">
                    <LinkedInPhoto name={dev.name} linkedin={dev.linkedin} cardColor={dev.cardColor} />
                </div>
            </div>

            {/* Card body */}
            <div className="pt-20 pb-6 px-6 text-center flex flex-col items-center gap-3">

                {/* Name & role */}
                <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{dev.name}</h2>
                    <span className={`mt-1.5 inline-block text-xs font-bold px-3 py-1 rounded-full ${dev.badgeColor}`}>
                        {dev.role}
                    </span>
                </div>

                {/* Bio */}
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{dev.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-2">
                    {dev.skills.map(skill => (
                        <span key={skill} className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* LinkedIn CTA */}
                <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A66C2] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                    <LinkedInSVG size={15} />
                    View Profile
                </a>
            </div>
        </article>
    );
}

/* ── Page ── */
export default function MeetTheDeveloper() {
    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 sm:p-5 md:p-8">

            {/* Decorative stars */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
                {[...Array(12)].map((_, i) => (
                    <Star
                        key={i}
                        size={8 + (i % 4) * 5}
                        className="absolute text-yellow-300 opacity-20"
                        style={{ top: `${(i * 43 + 6) % 92}%`, left: `${(i * 61 + 3) % 96}%`, transform: `rotate(${i * 30}deg)` }}
                        fill="currentColor"
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-7">

                {/* ── HERO BANNER ── */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-2xl">
                    <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/10 rounded-full" />
                    <div className="absolute top-5 right-28 w-5 h-5 bg-yellow-300/50 rounded-full" />
                    <div className="absolute bottom-6 right-16 w-3 h-3 bg-pink-300/50 rounded-full" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                                <Code2 size={38} className="text-yellow-300 drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-lg">
                                    Meet The Team
                                </h1>
                                <p className="text-purple-200 text-sm mt-0.5">
                                    The people who build &amp; power this platform ✨
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/30 shadow-lg self-start sm:self-auto">
                            <Zap size={18} className="text-yellow-300" />
                            <div>
                                <p className="text-white/70 text-xs font-semibold">Team size</p>
                                <p className="text-2xl font-black leading-none">{developers.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CARDS GRID ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developers.map(dev => (
                        <DeveloperCard key={dev.name} dev={dev} />
                    ))}
                </div>

                {/* ── FOOTER NOTE ── */}
                <p className="text-center text-xs text-slate-400 pb-4">
                    If a photo source fails, a safe fallback avatar is shown automatically.
                </p>
            </div>
        </div>
    );
}
