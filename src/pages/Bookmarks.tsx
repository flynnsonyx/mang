import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark as BookmarkIcon } from "lucide-react";
import PageTransition from "@/components/PageTransition";

const Bookmarks = () => {
  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold mb-6"
          >
            <span className="gradient-text">Bookmarks</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4 animate-pulse-glow">
              <BookmarkIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-display font-semibold mb-2">
              No bookmarks yet
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Start reading manga and bookmark your favorites to keep track of them here.
            </p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Bookmarks;
