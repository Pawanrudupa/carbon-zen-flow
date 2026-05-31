import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
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
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-0 md:ml-16 min-h-screen flex flex-col w-full overflow-x-hidden px-4 md:px-0">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 pb-24 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeSlide}>
            <ChallengesHeader />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-6">
            <ActiveChallenges />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <AvailableChallenges />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8 mb-8">
            <CompletedChallenges />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default Challenges;
