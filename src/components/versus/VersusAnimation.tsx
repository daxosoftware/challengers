import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Crown } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

interface Competitor {
  id: string;
  name: string;
  avatar?: string;
  seed: number;
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
  };
}

interface VersusAnimationProps {
  competitor1: Competitor;
  competitor2: Competitor;
  matchType: 'quarterfinal' | 'semifinal' | 'final';
  onAnimationComplete?: () => void;
}

export default function VersusAnimation() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'versus' | 'complete'>('entrance');
  const [showCountdown, setShowCountdown] = useState(false);
  
  // Mock data - in real app, fetch from match ID
  const mockMatch = {
    competitor1: {
      id: '1',
      name: 'Player Alpha',
      seed: 1,
      stats: { wins: 15, losses: 2, winRate: 88 }
    },
    competitor2: {
      id: '2', 
      name: 'Player Beta',
      seed: 4,
      stats: { wins: 12, losses: 5, winRate: 71 }
    },
    matchType: 'semifinal' as const
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('versus'), 2000);
    const timer2 = setTimeout(() => setShowCountdown(true), 4000);
    const timer3 = setTimeout(() => setAnimationPhase('complete'), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const getMatchTypeDisplay = (type: string) => {
    switch (type) {
      case 'quarterfinal': return 'QUART DE FINALE';
      case 'semifinal': return 'DEMI-FINALE';
      case 'final': return 'FINALE';
      default: return 'MATCH';
    }
  };

  const getMatchIcon = (type: string) => {
    switch (type) {
      case 'final': return Crown;
      case 'semifinal': return Trophy;
      default: return Zap;
    }
  };

  const MatchIcon = getMatchIcon(mockMatch.matchType);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-frog-primary/20 to-frog-secondary/20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
        
        {/* Match type indicator */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <MatchIcon className="h-8 w-8 text-frog-primary mr-3" />
            <h1 className="text-2xl md:text-4xl font-bold text-gradient-frog">
              {getMatchTypeDisplay(mockMatch.matchType)}
            </h1>
          </div>
        </motion.div>

        {/* Competitors */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Competitor 1 */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ 
                x: animationPhase === 'entrance' ? -300 : 0, 
                opacity: animationPhase === 'entrance' ? 0 : 1 
              }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="text-center"
            >
              <div className="card-glass p-6 rounded-2xl">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-frog-primary rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {mockMatch.competitor1.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{mockMatch.competitor1.name}</h2>
                <div className="text-frog-primary font-medium mb-3">Seed #{mockMatch.competitor1.seed}</div>
                <div className="space-y-1 text-sm text-white/80">
                  <div>Victoires: {mockMatch.competitor1.stats?.wins}</div>
                  <div>Défaites: {mockMatch.competitor1.stats?.losses}</div>
                  <div className="text-frog-primary font-medium">
                    Taux: {mockMatch.competitor1.stats?.winRate}%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* VS indicator */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: animationPhase === 'versus' ? [0, 1.2, 1] : 0,
                opacity: animationPhase === 'versus' ? 1 : 0
              }}
              transition={{ duration: 1, ease: "easeOut", delay: 2.5 }}
              className="text-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-4 border-4 border-frog-primary rounded-full flex items-center justify-center"
                >
                  <span className="text-3xl font-bold text-gradient-frog">VS</span>
                </motion.div>
                
                {/* Lightning effects */}
                <motion.div
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Zap className="h-8 w-8 text-frog-accent" />
                </motion.div>
              </div>
            </motion.div>

            {/* Competitor 2 */}
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ 
                x: animationPhase === 'entrance' ? 300 : 0, 
                opacity: animationPhase === 'entrance' ? 0 : 1 
              }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="text-center"
            >
              <div className="card-glass p-6 rounded-2xl">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-frog-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {mockMatch.competitor2.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{mockMatch.competitor2.name}</h2>
                <div className="text-frog-secondary font-medium mb-3">Seed #{mockMatch.competitor2.seed}</div>
                <div className="space-y-1 text-sm text-white/80">
                  <div>Victoires: {mockMatch.competitor2.stats?.wins}</div>
                  <div>Défaites: {mockMatch.competitor2.stats?.losses}</div>
                  <div className="text-frog-secondary font-medium">
                    Taux: {mockMatch.competitor2.stats?.winRate}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Countdown and actions */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mt-12 text-center"
            >
              <div className="glass-strong p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Le match commence dans</h3>
                <div className="text-4xl font-bold text-gradient-frog mb-6">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    05:00
                  </motion.span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="frog" 
                    onClick={() => navigate(`/matches/${matchId}`)}
                  >
                    Voir le match
                  </Button>
                  <Button 
                    variant="glass" 
                    onClick={() => navigate('/tournaments')}
                  >
                    Retour aux tournois
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
          onClick={() => navigate(`/matches/${matchId}`)}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-sm"
        >
          Passer l'animation
        </motion.button>
      </div>
    </div>
  );
}