import { render, screen, fireEvent } from '@testing-library/react';
import { CreateTournamentModal } from '../CreateTournamentModal';

describe('CreateTournamentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreateTournament = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly when open', () => {
    render(
      <CreateTournamentModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateTournament={mockOnCreateTournament} 
      />
    );

    expect(screen.getByText('Créer un tournoi')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom du tournoi')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de participants')).toBeInTheDocument();
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <CreateTournamentModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onCreateTournament={mockOnCreateTournament} 
      />
    );

    expect(screen.queryByText('Créer un tournoi')).not.toBeInTheDocument();
  });

  test('validates form on submit', async () => {
    render(
      <CreateTournamentModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateTournament={mockOnCreateTournament} 
      />
    );

    // Try to submit with empty fields
    fireEvent.click(screen.getByText('Suivant'));

    // Check validation errors
    expect(await screen.findByText('Le nom du tournoi doit contenir au moins 3 caractères non-blancs.')).toBeInTheDocument();
    expect(screen.getByText('Le nombre de participants doit être au moins 2.')).toBeInTheDocument();
  });

  test('creates tournament with valid data', () => {
    render(
      <CreateTournamentModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateTournament={mockOnCreateTournament} 
      />
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Nom du tournoi'), { target: { value: 'Test Tournament' } });
    fireEvent.change(screen.getByLabelText('Nombre de participants'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'group_stage' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });

    // Submit the form
    fireEvent.click(screen.getByText('Suivant'));
    fireEvent.click(screen.getByText('Suivant'));
    fireEvent.click(screen.getByText('Créer le tournoi'));

    // Check that onCreateTournament was called
    expect(mockOnCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Tournament',
      participantCount: '4',
      format: 'group_stage',
      description: 'Test description'
    }));
  });
});