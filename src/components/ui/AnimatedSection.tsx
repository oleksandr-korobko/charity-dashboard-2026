import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  forceVisible?: boolean;
}

export const AnimatedSection = ({ children, delay = 0, className = "", id, forceVisible = false }: AnimatedSectionProps) => {
  return (
    <motion.div
      id={id}
      initial={forceVisible ? false : { opacity: 0, y: 50 }}
      whileInView={forceVisible ? undefined : { opacity: 1, y: 0 }}
      animate={forceVisible ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
      className={`w-full min-w-0 ${className}`}
    >
      {children}
    </motion.div>
  );
};
