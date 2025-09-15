import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../dashboard/Dashboard';

export default function HomePage() {
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return (
    <div>
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}