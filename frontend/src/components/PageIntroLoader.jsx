import { motion } from "framer-motion";

export default function PageIntroLoader({ message = "Loading..." }) {
  return (
    <>
      <style>
        {`
          .heart-loader {
            width: 60px;
            aspect-ratio: 1;
            background: linear-gradient(#dc1818 0 0) bottom/100% 0% no-repeat #f5e6c8;
            -webkit-mask:
              radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
              radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
              linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
              linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
            -webkit-mask-size: 50% 50%;
            -webkit-mask-repeat: no-repeat;
            mask:
              radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
              radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
              linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
              linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
            mask-size: 50% 50%;
            mask-repeat: no-repeat;
            animation: heart-fill 2s infinite linear;
          }
          @keyframes heart-fill {
            90%, 100% { background-size: 100% 100%; }
          }
        `}
      </style>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="heart-loader" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-slate-800"
          >
            {message}
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}
