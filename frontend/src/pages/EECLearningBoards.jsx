import React from "react";
import { motion } from "framer-motion";

export default function EECLearningBoards() {
  return (
    <div className="text-blue-950 overflow-x-hidden selection:bg-yellow-200/60">
      {/* ===== Hero Section with Shape Divider ===== */}
      <section className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden">
        <img
          src="/learn-hero.jpeg"
          alt="Learning Hero"
          className="w-full h-full object-cover object-center"
        />

        {/* Overlay Text */}
        <div className="absolute flex items-center justify-center">
          {/* <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-white text-center px-4 drop-shadow-lg"
          >
            Learning Beyond Boundaries
          </motion.h1> */}
        </div>

        {/* Shape Divider */}
        {/* <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-[120px] md:h-[160px]"
          >
            <path
              fill="#f0f4ff"
              fillOpacity="1"
              d="M0,192L48,165.3C96,139,192,85,288,74.7C384,64,480,96,576,144C672,192,768,256,864,272C960,288,1056,256,1152,224C1248,192,1344,160,1392,144L1440,128V320H0Z"
            ></path>
          </svg>
        </div> */}
      </section>

      {/* ===== Education Boards Section ===== */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            Recognized Education Boards
          </motion.h2>
          <div className="mx-auto h-[3px] w-24 bg-yellow-400 rounded-full mb-10" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-12 justify-items-center">
            {[
              { src: "/cbse.png", title: "C.B.S.E" },
              { src: "/icse2.png", title: "I.C.S.E" },
              { src: "/wb.png", title: "W.B.C.S.E" },
              { src: "/ib.png", title: "INTERNATIONAL BOARD" },
            ].map((board, i) => (
              <motion.div
                key={board.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl border border-blue-100/60 p-8 transition-all flex flex-col items-center"
              >
                <div className="relative h-28 w-28 mb-4 flex items-center justify-center">
                  <img
                    src={board.src}
                    alt={board.title}
                    className="h-full w-full object-contain transition-transform group-hover:scale-110"
                  />
                </div>
                <h4 className="text-lg md:text-xl font-semibold text-blue-900">
                  {board.title}
                </h4>
                <span className="block mt-2 text-sm text-gray-500 group-hover:text-blue-700 transition">
                  Accredited & Trusted
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
