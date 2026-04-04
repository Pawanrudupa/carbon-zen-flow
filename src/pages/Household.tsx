import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HouseholdHeader from "@/components/household/HouseholdHeader";
import HouseholdOverview from "@/components/household/HouseholdOverview";
import MemberCards from "@/components/household/MemberCards";
import Leaderboard from "@/components/household/Leaderboard";
import SharedChallenges from "@/components/household/SharedChallenges";
import InviteSection from "@/components/household/InviteSection";
import InviteModal from "@/components/household/InviteModal";

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

const Household = () => {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-16 min-h-screen flex flex-col">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeSlide}>
            <HouseholdHeader onInvite={() => setInviteOpen(true)} />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-6">
            <HouseholdOverview />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <MemberCards />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <Leaderboard />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <SharedChallenges />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8 mb-8">
            <InviteSection />
          </motion.div>
        </motion.main>
      </div>
      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
};

export default Household;
