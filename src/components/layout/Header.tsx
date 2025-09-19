import React, { useState } from 'react';
import { Trophy, User, Menu, X, Plus, Search, Settings, LogOut, Home, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import CreateTournamentModal from '../tournaments/CreateTournamentModal';
import AuthModal from '../auth/AuthModal';
import ProfileModal from '../auth/ProfileModal';
import NotificationCenter from '../ui/NotificationCenter';

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [createTournamentOpen, setCreateTournamentOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleCreateTournament = (tournament: any) => {
    console.log('Tournament created:', tournament);
    // Here you would typically save the tournament to your backend/state management
  };

  return (
    <header className="glass-strong border-b border-white/20 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="frog-glow p-2 rounded-xl">
                <Trophy className="h-8 w-8 text-gradient-frog" />
              </div>
              <span className="ml-3 text-xl font-bold text-gradient-frog">Challengers</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            <Link 
              to="/" 
              className={`flex items-center space-x-1 font-medium transition-all duration-300 hover:scale-105 ${
                location.pathname === '/' 
                  ? 'text-frog-primary' 
                  : 'text-white/80 hover:text-frog-primary'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Accueil</span>
            </Link>
            <Link 
              to="/tournaments" 
              className={`flex items-center space-x-1 font-medium transition-all duration-300 hover:scale-105 ${
                location.pathname === '/tournaments' 
                  ? 'text-frog-primary' 
                  : 'text-white/80 hover:text-frog-primary'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Tournois</span>
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className={`flex items-center space-x-1 font-medium transition-all duration-300 hover:scale-105 ${
                  location.pathname === '/dashboard' 
                    ? 'text-frog-primary' 
                    : 'text-white/80 hover:text-frog-primary'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Tableau de bord</span>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  variant="frog" 
                  size="sm"
                  onClick={() => setCreateTournamentOpen(true)}
                  className="frog-effect"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau Tournoi
                </Button>
                
                <NotificationCenter />

                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-3 text-white/80 hover:text-frog-primary transition-all duration-300 hover:scale-105 glass px-4 py-2 rounded-xl"
                  >
                    <div className="h-8 w-8 bg-gradient-frog-primary rounded-full flex items-center justify-center frog-glow">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-glass-strong py-2 z-50 border border-white/20">
                      <button
                        onClick={() => {
                          setProfileModalOpen(true);
                          setProfileMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-frog-primary hover:bg-white/10 transition-all duration-300"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Mon Profil
                      </button>
                      <button
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-frog-primary hover:bg-white/10 transition-all duration-300"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </button>
                      <hr className="my-1 border-white/20" />
                      <button
                        onClick={() => {
                          signOut();
                          setProfileMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-frog-primary hover:bg-white/10 transition-all duration-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="frog"
                  onClick={() => {
                    setAuthModalTab('login');
                    setAuthModalOpen(true);
                  }}
                  className="frog-effect"
                >
                  Se connecter
                </Button>
                <Button 
                  variant="frog"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setAuthModalOpen(true);
                  }}
                  className="frog-effect"
                >
                  S'inscrire
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/80 hover:text-frog-primary transition-all duration-300 glass rounded-xl"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/20" role="navigation" aria-label="Mobile navigation">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link 
                to="/" 
                className={`flex items-center space-x-3 block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  location.pathname === '/' 
                    ? 'text-frog-primary bg-frog-primary/10' 
                    : 'text-white/80 hover:text-frog-primary hover:bg-white/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Accueil</span>
              </Link>
              <Link 
                to="/tournaments" 
                className={`flex items-center space-x-3 block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  location.pathname === '/tournaments' 
                    ? 'text-frog-primary bg-frog-primary/10' 
                    : 'text-white/80 hover:text-frog-primary hover:bg-white/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy className="h-5 w-5" />
                <span>Tournois</span>
              </Link>
              {user && (
                <Link 
                  to="/dashboard" 
                  className={`flex items-center space-x-3 block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    location.pathname === '/dashboard' 
                      ? 'text-frog-primary bg-frog-primary/10' 
                      : 'text-white/80 hover:text-frog-primary hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Tableau de bord</span>
                </Link>
              )}
              {!user && (
                <div className="pt-4 space-y-3">
                  <Button 
                    variant="frog" 
                    className="w-full justify-center py-3"
                    onClick={() => {
                      setAuthModalTab('login');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Se connecter
                  </Button>
                  <Button 
                    variant="frog" 
                    className="w-full justify-center py-3"
                    onClick={() => {
                      setAuthModalTab('signup');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    S'inscrire
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateTournamentModal
        isOpen={createTournamentOpen}
        onClose={() => setCreateTournamentOpen(false)}
        onCreateTournament={handleCreateTournament}
      />
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
      
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}