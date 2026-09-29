"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import ProfileView from '@/src/components/ProfileView.jsx';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <motion.div
      key="profile-view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      style={{ width: '100%' }}
    >
      <ProfileView onBackToHome={() => router.push('/')} />
    </motion.div>
  );
}
