import { useState, useEffect } from 'react';
import { Trophy, Users, Award, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import TournamentCard from '../tournaments/TournamentCard';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import CreateTournamentModal from '../tournaments/CreateTournamentModal';
import { useTournamentStore, useUserStore, useRealtimeStore } from '../../stores';

export default function Dashboard() {
  const { user } = useAuth();
  const [createTournamentOpen, setCreateTournamentOpen] = useState(false);
  
  // Zustand stores
  const {
    recentTournaments,
    stats,
    loading,
    fetchTournaments,
    createTournament
  } = useTournamentStore();
  
  const { fetchProfile } = useUserStore();
  const { subscribeToTournaments } = useRealtimeStore();

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchTournaments();
      fetchProfile(user.id);
      subscribeToTournaments();
    }
  }, [user, fetchTournaments, fetchProfile, subscribeToTournaments]);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-frog-primary mx-auto mb-4"></div>
          <p className="text-white text-gradient-frog font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-gradient-frog">
          Bonjour, {user?.username} 👋
        </h1>
        <p className="text-white/80">
          Voici un aperçu de votre activité de tournoi
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatsCard
          title={user?.role === 'organizer' ? 'Tournois créés' : 'Tournois rejoints'}
          value={stats.total}
          icon={Trophy}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Tournois actifs"
          value={stats.active}
          icon={Clock}
          color="green"
        />
        <StatsCard
          title={user?.role === 'organizer' ? 'Total participants' : 'Matchs joués'}
          value={user?.role === 'organizer' ? recentTournaments.reduce((sum: number, t: any) => sum + t.current_participants, 0) : 45}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
        <StatsCard
          title={user?.role === 'organizer' ? 'Tournois complétés' : 'Taux de victoire'}
          value={user?.role === 'organizer' ? stats.completed : '85%'}
          icon={Award}
          trend={{ value: user?.role === 'organizer' ? 15 : 3, isPositive: true }}
          color="yellow"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Tournaments */}
        <div className="card-glass p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {user?.role === 'organizer' ? 'Mes tournois récents' : 'Tournois récents'}
            </h2>
            <Button variant="glass" size="sm">
              Voir tout
            </Button>
          </div>
          <div className="space-y-4">
            {recentTournaments.map((tournament: any) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                showActions={false}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Actions rapides</h2>
          <div className="space-y-4">
            {user?.role === 'organizer' ? (
              <>
                <div className="card-frog p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2 text-white">Créer un nouveau tournoi</h3>
                  <p className="text-white/80 mb-4">
                    Organisez votre prochain tournoi en quelques minutes
                  </p>
                  <Button 
                    variant="frog" 
                    onClick={() => setCreateTournamentOpen(true)}
                  >
                    Commencer
                  </Button>
                </div>
                
                <div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">Gérer les tournois</h3>
                  <p className="text-white/80 mb-4">
                    Mettez à jour vos tournois en cours et gérez les participants
                  </p>
                  <Button variant="glass">
                    Gérer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="card-frog p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2 text-white">Rejoindre un tournoi</h3>
                  <p className="text-white/80 mb-4">
                    Découvrez les tournois ouverts et inscrivez-vous
                  </p>
                  <Button variant="frog">
                    Explorer
                  </Button>
                </div>
                
                <div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">Mes matchs à venir</h3>
                  <p className="text-white/80 mb-4">
                    Consultez votre planning et préparez-vous
                  </p>
                  <Button variant="glass">
                    Voir planning
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CreateTournamentModal
        isOpen={createTournamentOpen}
        onClose={() => setCreateTournamentOpen(false)}
        onCreateTournament={handleCreateTournament}
      />
    </div>
  );
}