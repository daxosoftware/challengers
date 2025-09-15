import React, { useState } from 'react';
import { Trophy, Users, Calendar, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';

export default function HeroSection() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');

  const openAuthModal = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Organisez des tournois
              <span className="block text-gradient-frog">comme un pro</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              La plateforme ultime pour créer, gérer et participer à des tournois en ligne. 
              Simple, rapide et professionnel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {user ? (
                <>
                  <Link to="/tournaments" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      variant="frog"
                      className="frog-effect w-full sm:w-auto"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Voir les tournois
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/dashboard" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      variant="glass"
                      className="frog-effect w-full sm:w-auto"
                    >
                      Mon tableau de bord
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant="frog"
                    className="frog-effect w-full sm:w-auto"
                    onClick={() => openAuthModal('signup')}
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    Commencer gratuitement
                  </Button>
                  <Button 
                    size="lg" 
                    variant="glass"
                    className="frog-effect w-full sm:w-auto"
                    onClick={() => openAuthModal('login')}
                  >
                    Se connecter
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="card-frog p-6 text-center">
              <div className="bg-gradient-frog-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 frog-glow">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Configuration rapide</h3>
              <p className="text-white/80">
                Créez un tournoi en moins de 2 minutes avec nos templates prêts à l'emploi
              </p>
            </div>

            <div className="card-frog p-6 text-center">
              <div className="bg-gradient-frog-secondary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 frog-glow">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Gestion automatique</h3>
              <p className="text-white/80">
                Tableaux générés automatiquement, notifications et suivi en temps réel
              </p>
            </div>

            <div className="card-frog p-6 text-center">
              <div className="bg-gradient-frog-accent w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 frog-glow">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Formats multiples</h3>
              <p className="text-white/80">
                Élimination simple/double, round robin et formats personnalisés
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
      />
    </>
  );
}