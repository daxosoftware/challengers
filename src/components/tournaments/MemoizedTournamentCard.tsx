import { memo } from 'react';
import TournamentCard from './TournamentCard';
import { Tournament } from '../../types';

interface MemoizedTournamentCardProps {
  tournament: Tournament;
  onView: (tournamentId: string) => void;
  onJoin: (tournamentId: string) => void;
  showActions?: boolean;
}

const MemoizedTournamentCard = memo<MemoizedTournamentCardProps>(({
  tournament,
  onView,
  onJoin,
  showActions = true
}) => {
  return (
    <TournamentCard
      tournament={tournament}
      onView={onView}
      onJoin={onJoin}
      showActions={showActions}
    />
  );
});

MemoizedTournamentCard.displayName = 'MemoizedTournamentCard';

export default MemoizedTournamentCard;
