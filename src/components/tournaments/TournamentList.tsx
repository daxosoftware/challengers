import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import MemoizedTournamentCard from './MemoizedTournamentCard';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CreateTournamentModal from './CreateTournamentModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentStore, useRealtimeStore } from '../../stores';
import { useDebounce } from '../../hooks/useDebounce';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

export default function TournamentList() {
  const { user } = useAuth();
  const [createTournamentOpen, setCreateTournamentOpen] = useState(false);
  
  // Performance monitoring
  usePerformanceMonitor('TournamentList');
  
  // Zustand stores
  const {
    filteredTournaments,
    loading,
    error,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    fetchTournaments,
    createTournament,
    clearError
  } = useTournamentStore();
  
  const { subscribeToTournaments } = useRealtimeStore();
  
  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch tournaments on component mount
  useEffect(() => {
    fetchTournaments();
    subscribeToTournaments();
  }, [fetchTournaments, subscribeToTournaments]);

  const handleCreateTournament = async (tournamentData: any) => {
    await createTournament({
      name: tournamentData.name,
      description: tournamentData.description,
      format: tournamentData.format === 'fixtures' ? 'single_elimination' : 'round_robin',
      max_participants: parseInt(tournamentData.participantCount),
      current_participants: 0,
      status: 'draft',
      start_date: new Date().toISOString(),
      organizer_id: user?.id || '',
    });
    
    setCreateTournamentOpen(false);
  };



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="lg" text="Chargement des tournois..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-gradient-frog">Tournois</h1>
          <p className="text-white/80 text-sm md:text-base">Découvrez et participez aux tournois en cours</p>
        </div>
        <Button 
          variant="frog" 
          className="w-full sm:w-auto"
          onClick={() => setCreateTournamentOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un tournoi
        </Button>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-2xl mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un tournoi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-white/60"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-glass px-4 py-2 rounded-lg text-white bg-transparent"
            >
              <option value="all" className="bg-slate-800">Tous les statuts</option>
              <option value="registration_open" className="bg-slate-800">Inscriptions ouvertes</option>
              <option value="in_progress" className="bg-slate-800">En cours</option>
              <option value="completed" className="bg-slate-800">Terminés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="mx-auto w-20 h-20 md:w-24 md:h-24 glass-strong rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 md:h-12 md:w-12 text-frog-primary" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Aucun tournoi trouvé</h3>
          <p className="text-white/80 mb-6 text-sm md:text-base px-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Il n\'y a actuellement aucun tournoi disponible'
            }
          </p>
          <Button 
            variant="frog"
            onClick={() => setCreateTournamentOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer le premier tournoi
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTournaments.map((tournament) => (
            <MemoizedTournamentCard
              key={tournament.id}
              tournament={tournament}
              onView={(tournamentId) => console.log('View tournament:', tournamentId)}
              onJoin={(tournamentId) => console.log('Join tournament:', tournamentId)}
            />
          ))}
        </div>
      )}

      <CreateTournamentModal
        isOpen={createTournamentOpen}
        onClose={() => setCreateTournamentOpen(false)}
        onCreateTournament={handleCreateTournament}
      />
    </div>
  );
}