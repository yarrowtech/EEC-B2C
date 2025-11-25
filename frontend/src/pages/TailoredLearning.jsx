import { Book, Brain, Clapperboard } from "lucide-react";
import React from "react";

export default function TailoredLearning() {
  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero (Parallax) ===== */}
      <section className="relative flex h-[56vh] w-full max-w-[100vw] overflow-hidden items-center justify-center bg-[url('/Banner1.jpg')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/65" />
        <div className="relative z-10 px-6 text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Tailored Content for Cognitive Needs
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-blue-50/90">
            EEC delivers personalized learning paths that address each student's unique cognitive requirements.
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
        {/* ===== Overview ===== */}
        <section className="py-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Personalized Content for Every Student</h2>
              <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                At EEC, we understand that every student is unique. Our tailored content is specifically designed to
                address individual cognitive needs, ensuring that learning is both effective and engaging. By analyzing
                students’ strengths and areas for improvement, we provide customized resources that promote deeper
                understanding and retention.
              </p>
            </div>
            <div className="group relative order-first md:order-last">
              <img
                src="/toll1.jpg"
                alt="Tailored Learning Content"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-sky-200/40 to-amber-200/40 blur-lg" />
            </div>
          </div>
        </section>

        {/* ===== Key Features ===== */}
        <section className="py-14">
          <h2 className="text-center text-2xl font-semibold">Key Features of Tailored Learning</h2>
          <div className="mx-auto mt-2 h-[3px] w-24 bg-yellow-400" />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white p-6 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-sky-200/60 to-amber-200/60 blur-xl" />
              <div className="text-3xl"><Brain /> </div>
              <h4 className="mt-3 text-lg font-semibold">Individual Cognitive Analysis</h4>
              <p className="mt-1 text-blue-900/90">
                We analyze each student’s cognitive abilities, strengths, and areas for improvement to provide tailored
                learning experiences.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white p-6 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-fuchsia-200/60 to-sky-200/60 blur-xl" />
              <div className="text-3xl"><Book /></div>
              <h4 className="mt-3 text-lg font-semibold">Customized Resources</h4>
              <p className="mt-1 text-blue-900/90">
                Our platform provides personalized resources and materials, addressing each student’s unique learning
                style and needs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white p-6 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/60 to-fuchsia-200/60 blur-xl" />
              <div className="text-3xl"><Clapperboard /></div>
              <h4 className="mt-3 text-lg font-semibold">Diverse Multimedia Content</h4>
              <p className="mt-1 text-blue-900/90">
                We offer a diverse range of multimedia materials, ensuring that students engage with content that suits
                their learning preferences.
              </p>
            </div>
          </div>
        </section>

        {/* ===== Benefits ===== */}
        <section className="py-14">
          <div className="grid items-center gap-10 md:grid-cols-2 md:flex-row-reverse">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl font-semibold">Empowering Students with Tailored Learning</h2>
              <div className="mb-4 mt-2 h-[3px] w-24 bg-yellow-400" />
              <p className="leading-relaxed text-blue-900/90">
                Our tailored content empowers students by offering the right support they need to thrive academically.
                Whether it’s through customized lessons or diverse learning materials, EEC ensures students have the
                tools to succeed.
              </p>
            </div>
            <div className="order-1 md:order-2 group relative">
              <img
                src="/plan-graph-knowledge-steps.jpg"
                alt="Engaging Learning Journey"
                className="relative z-10 w-full rounded-3xl border border-blue-100/60 shadow-xl transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-200/40 to-sky-200/40 blur-lg" />
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        {/* <section className="py-14 text-center">
          <h2 className="text-2xl font-semibold">Ready to Experience Tailored Education?</h2>
          <div className="mx-auto mt-2 h-[3px] w-24 bg-yellow-400" />
          <p className="mx-auto mt-4 max-w-2xl text-blue-900/90">
            Unlock the power of personalized, cognitive-based learning with EEC’s tailored content.
          </p>
        </section> */}
      </div>
    </div>
  );
}
