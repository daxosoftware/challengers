import { Calendar, Users, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface TournamentCardProps {
  tournament: Tournament;
  onView?: (tournamentId: string) => void;
  onJoin?: (tournamentId: string) => void;
  showActions?: boolean;
}

export default function TournamentCard({ 
  tournament, 
  onView, 
  onJoin, 
  showActions = true 
}: TournamentCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    draft: 'default',
    registration_open: 'success',
    in_progress: 'warning',
    completed: 'info',
  } as const;

  const statusLabels = {
    draft: 'Brouillon',
    registration_open: 'Inscriptions ouvertes',
    in_progress: 'En cours',
    completed: 'Terminé',
  };

  const formatLabels = {
    single_elimination: 'Élimination simple',
    double_elimination: 'Double élimination',
    round_robin: 'Round Robin',
  };

  const handleViewVersus = () => {
    // Navigate to versus animation for demo purposes
    navigate(`/versus/demo-match-${tournament.id}`);
  };
  return (
    <article className="card-glass p-4 md:p-6 rounded-2xl hover:card-frog transition-all duration-300" role="article" aria-labelledby={`tournament-${tournament.id}-title`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <h3 id={`tournament-${tournament.id}-title`} className="text-base md:text-lg font-semibold text-white mb-2 line-clamp-2">{tournament.name}</h3>
          <Badge variant={statusColors[tournament.status]}>
            {statusLabels[tournament.status]}
          </Badge>
        </div>
        <div className="text-left sm:text-right text-sm text-white/80">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(tournament.start_date).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {tournament.description && (
        <p className="text-white/80 text-sm mb-4 line-clamp-2">{tournament.description}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-white/80 mb-4 space-y-2 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {tournament.current_participants}/{tournament.max_participants}
          </div>
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{formatLabels[tournament.format]}</span>
            <span className="sm:hidden">{tournament.format.replace('_', ' ')}</span>
          </div>
        </div>
        
        {tournament.prize_pool && (
          <div className="text-frog-primary font-medium">
            {tournament.prize_pool}
          </div>
        )}
      </div>

      <div className="text-xs text-white/60 mb-4">
        Organisé par <span className="font-medium text-white">{tournament.organizer.username}</span>
      </div>

      {showActions && (
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="glass"
            size="sm"
            onClick={() => onView?.(tournament.id)}
            className="flex-1"
            aria-label={`Voir les détails du tournoi ${tournament.name}`}
          >
            Voir détails
          </Button>
          {tournament.status === 'in_progress' && (
            <Button
              variant="frog"
              size="sm"
              onClick={handleViewVersus}
              className="flex-1"
              aria-label={`Voir l'animation versus du tournoi ${tournament.name}`}
            >
              Versus
            </Button>
          )}
          {tournament.status === 'registration_open' && (
            <Button
              variant="frog"
              size="sm"
              onClick={() => onJoin?.(tournament.id)}
              className="flex-1"
              aria-label={`S'inscrire au tournoi ${tournament.name}`}
            >
              S'inscrire
            </Button>
          )}
        </div>
      )}
    </article>
  );
}