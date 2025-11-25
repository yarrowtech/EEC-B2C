import React from "react";

export default function ProductAdvantages() {
  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero (Parallax) ===== */}
      <section className="relative flex h-[56vh] w-full max-w-[100vw] overflow-hidden items-center justify-center bg-[url('/product_adv.jpg')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/45" />
        <div className="relative z-10 px-6 text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Product Advantages
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-blue-50/90">
            Explore how EEC enhances learning for every student.
          </p>
        </div>
        <svg
          className="pointer-events-none absolute -bottom-[1px] left-0 w-full"
          viewBox="0 0 1440 120"
          aria-hidden
        >
          <path
            fill="#ffffff"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,80C672,85,768,107,864,117.3C960,128,1056,128,1152,117.3C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </section>

      {/* ===== Container ===== */}
      <div className="mx-auto max-w-6xl px-6">

        {/* Block 1 — Personalized Learning */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Personalized Learning</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <p className="leading-relaxed text-blue-900/90">
              Give your child the gift of tailored education with EEC&apos;s personalized
              learning platform, empowering them to learn, grow, and succeed in their own way.
            </p>
          </div>
          <div className="group relative">
            <img
              src="/personalize.jpg"
              alt="Personalized Learning"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 2 — Interactive Classes (reverse) */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-semibold">Interactive Classes</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Interactive quizzes to test knowledge</li>
              <li>Engaging activities to stimulate creativity</li>
              <li>Tryouts to apply skills in real-world scenarios</li>
            </ul>
            <p className="mt-3 leading-relaxed text-blue-900/90">
              Watch your child thrive in a dynamic, hands-on learning environment!
            </p>
          </div>
          <div className="order-1 md:order-2 group relative">
            <img
              src="/Screenshot (6739).png"
              alt="Interactive Classes"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-sky-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 3 — Limited Screen Time */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Limited Screen Time</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Prevents eye strain and promotes healthy habits</li>
              <li>Regular breaks for physical activity and play</li>
              <li>Balance of digital and offline learning</li>
            </ul>
          </div>
          <div className="group relative">
            <img
              src="/lscreen.jpg"
              alt="Limited Screen Time"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-fuchsia-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 4 — Continuous Learning (reverse) */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-semibold">Continuous Learning</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Adaptive learning pathways</li>
              <li>New skills and concepts introduced regularly</li>
              <li>Ongoing feedback and progress assessment</li>
            </ul>
          </div>
          <div className="order-1 md:order-2 group relative">
            <img
              src="/continious part.png"
              alt="Continuous Learning"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 5 — Goal-Oriented Approach */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Goal-Oriented Approach</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Clear learning objectives</li>
              <li>Customized learning plans</li>
              <li>Progress tracking and assessment</li>
            </ul>
          </div>
          <div className="group relative">
            <img
              src="/goal1.jpg"
              alt="Goal-Oriented Approach"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-sky-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 6 — Rewards System (reverse) */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-semibold">Rewards System</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Badges and certificates for milestones</li>
              <li>Points for completing challenges</li>
              <li>Leaderboards to boost motivation</li>
            </ul>
          </div>
          <div className="order-1 md:order-2 group relative">
            <img
              src="/rewards.jpg"
              alt="Rewards System"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-amber-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 7 — Parent & Teacher Involvement */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Parent &amp; Teacher Involvement</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Regular progress updates</li>
              <li>Parent-teacher conferences and feedback</li>
              <li>Collaborative goal-setting and planning</li>
            </ul>
          </div>
          <div className="group relative">
            <img
              src="/enhaned.jpg"
              alt="Parent & Teacher Involvement"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
          </div>
        </div>

        {/* Block 8 — Accessible Resources (reverse) */}
        <div className="py-14 grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-semibold">Accessible Resources</h2>
            <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">
              <li>Multilingual support</li>
              <li>Audio &amp; visual learning aids</li>
              <li>Mobile-friendly access</li>
            </ul>
          </div>
          <div className="order-1 md:order-2 group relative">
            <img
              src="/city-committed-education-collage-concept.jpg"
              alt="Accessible Resources"
              className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-amber-200/40 to-fuchsia-200/40 blur-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
