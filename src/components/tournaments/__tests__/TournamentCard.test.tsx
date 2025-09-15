import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TournamentCard from '../TournamentCard';
import { Tournament } from '../../../types';

// Mock tournament data
const mockTournament: Tournament = {
  id: '1',
  name: 'Test Tournament',
  description: 'A test tournament description',
  format: 'single_elimination',
  max_participants: 16,
  current_participants: 8,
  status: 'registration_open',
  start_date: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  organizer: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    avatar_url: null,
    role: 'organizer',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  prize_pool: '1000€',
};

describe('TournamentCard', () => {
  it('renders tournament information', () => {
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={vi.fn()}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('A test tournament description')).toBeInTheDocument();
    expect(screen.getByText('8/16')).toBeInTheDocument();
    expect(screen.getByText('Élimination simple')).toBeInTheDocument();
    expect(screen.getByText('1000€')).toBeInTheDocument();
    expect(screen.getByText('Organisé par testuser')).toBeInTheDocument();
  });

  it('shows correct status badge', () => {
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={vi.fn()}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText('Inscriptions ouvertes')).toBeInTheDocument();
  });

  it('handles view button click', () => {
    const handleView = vi.fn();
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={handleView}
        onJoin={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Voir détails'));
    expect(handleView).toHaveBeenCalledWith('1');
  });

  it('handles join button click when registration is open', () => {
    const handleJoin = vi.fn();
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={vi.fn()}
        onJoin={handleJoin}
      />
    );

    fireEvent.click(screen.getByText('S\'inscrire'));
    expect(handleJoin).toHaveBeenCalledWith('1');
  });

  it('does not show join button when registration is closed', () => {
    const closedTournament = { ...mockTournament, status: 'in_progress' as const };
    
    render(
      <TournamentCard
        tournament={closedTournament}
        onView={vi.fn()}
        onJoin={vi.fn()}
      />
    );

    expect(screen.queryByText('S\'inscrire')).not.toBeInTheDocument();
  });

  it('hides actions when showActions is false', () => {
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={vi.fn()}
        onJoin={vi.fn()}
        showActions={false}
      />
    );

    expect(screen.queryByText('Voir détails')).not.toBeInTheDocument();
    expect(screen.queryByText('S\'inscrire')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TournamentCard
        tournament={mockTournament}
        onView={vi.fn()}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Voir détails')).toHaveAttribute(
      'aria-label',
      'Voir les détails du tournoi Test Tournament'
    );
    expect(screen.getByText('S\'inscrire')).toHaveAttribute(
      'aria-label',
      'S\'inscrire au tournoi Test Tournament'
    );
  });
});

