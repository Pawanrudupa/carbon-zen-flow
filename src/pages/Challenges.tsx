import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChallengesHeader from "@/components/challenges/ChallengesHeader";
import ActiveChallenges from "@/components/challenges/ActiveChallenges";
import AvailableChallenges from "@/components/challenges/AvailableChallenges";
import CompletedChallenges from "@/components/challenges/CompletedChallenges";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const Challenges = () => {
  return (
    <DashboardLayout>
      <motion.div
        className="w-full max-w-full overflow-x-hidden"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeSlide}>
          <ChallengesHeader />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-6 min-w-0">
          <ActiveChallenges />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-8 min-w-0">
          <AvailableChallenges />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-8 mb-8 min-w-0">
          <CompletedChallenges />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Challenges;
