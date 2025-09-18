import React, { useState, useCallback } from 'react';
import { X, Users, Trophy, Shuffle, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { Validator, ValidationSchemas, DataSanitizer } from '../../utils/validation';
import { TournamentErrorBoundary } from '../ErrorBoundary';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTournament: (tournament: any) => void;
}
import { Participant, Match, Group, generateFixturesBracket, generateGroupStage } from '../../utils/tournamentBracketGenerator';

export default function CreateTournamentModal({ 
  isOpen, 
  onClose, 
  onCreateTournament 
}: CreateTournamentModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    participantCount: '',
    format: 'fixtures' as 'fixtures' | 'group_stage',
    description: ''
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [bracket, setBracket] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  if (!isOpen) return null;

  // Enhanced form validation using validation system
  const validateForm = () => {
    // Sanitize form data
    const sanitizedData = DataSanitizer.sanitizeObject(formData, {
      name: 'string',
      description: 'string',
      participantCount: 'integer',
      format: 'string',
    });
    
    // Create validation schema for tournament
    const tournamentSchema = {
      name: ValidationSchemas.tournament.name,
      maxParticipants: {
        ...ValidationSchemas.tournament.maxParticipants,
        custom: (value: any) => {
          const count = parseInt(value);
          if (isNaN(count) || count < 2) {
            return 'Le nombre de participants doit être au moins 2.';
          }
          if (count > 128) {
            return 'Maximum 128 participants autorisés.';
          }
          if (formData.format === 'group_stage' && count < 4) {
            return 'Format groupe nécessite au moins 4 participants.';
          }
          return null;
        },
      },
      description: ValidationSchemas.tournament.description,
    };
    
    // Validate
    const validation = Validator.validate({
      name: sanitizedData.name,
      maxParticipants: sanitizedData.participantCount,
      description: sanitizedData.description,
    }, tournamentSchema);
    
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  // Generate participant slots
  const generateParticipants = () => {
    if (!validateForm()) return;

    const count = parseInt(formData.participantCount);
    const newParticipants: Participant[] = [];

    for (let i = 1; i <= count; i++) {
      newParticipants.push({
        id: `participant-${i}`,
        name: `Participant ${i}`,
        seed: i
      });
    }

    setParticipants(newParticipants);
    setStep(2);
  };

  // Shuffle participants
  const shuffleParticipants = () => {
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Reassign seeds after shuffle
    const reseeded = shuffled.map((participant, index) => ({
      ...participant,
      seed: index + 1
    }));

    setParticipants(reseeded);
  };

  // Update participant name
  const updateParticipantName = (id: string, name: string) => {
    setParticipants(prev => 
      prev.map(p => p.id === id ? { ...p, name: name || `Participant ${p.seed}` } : p)
    );
  };

  // Handle input changes with validation
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, validationErrors]);
  
  // Get field error helper
  const getFieldError = useCallback((field: string) => {
    return validationErrors[field] || errors[field];
  }, [validationErrors, errors]);

  // Generate bracket based on format
  const generateBracket = () => {
    if (formData.format === 'fixtures') {
      setBracket(generateFixturesBracket(participants));
    } else {
      const { groups: generatedGroups, knockoutBracket } = generateGroupStage(participants);
      setGroups(generatedGroups);
      setBracket(knockoutBracket);
    }
    setStep(3);
  };

  // Create tournament
  const createTournament = () => {
    const tournament = {
      id: `tournament-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      format: formData.format,
      participants,
      bracket,
      groups: formData.format === 'group_stage' ? groups : [],
      status: 'draft',
      created_at: new Date().toISOString()
    };

    onCreateTournament(tournament);
    onClose();
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      participantCount: '',
      format: 'fixtures',
      description: ''
    });
    setParticipants([]);
    setErrors({});
    setBracket([]);
    setGroups([]);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <TournamentErrorBoundary>
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="create-tournament-title">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <div className="inline-block align-bottom modal-glass rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 mx-4 sm:mx-0">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={handleClose}
              className="glass-strong rounded-md text-white/60 hover:text-white focus:outline-none p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header */}
              <div className="mb-6">
                <h3 id="create-tournament-title" className="text-2xl font-bold text-white flex items-center text-gradient-frog">
                  <Trophy className="h-6 w-6 mr-2 text-frog-primary" />
                  Créer un nouveau tournoi
                </h3>
                <div className="flex items-center mt-4 space-x-2 sm:space-x-4 overflow-x-auto">
                  <div className={`flex items-center ${step >= 1 ? 'text-frog-primary' : 'text-white/40'} flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 1 ? 'bg-frog-primary text-white' : 'glass-strong'
                    }`}>1</div>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Configuration</span>
                    <span className="ml-2 text-xs font-medium sm:hidden">Config</span>
                  </div>
                  <div className={`w-6 sm:w-8 h-1 ${step >= 2 ? 'bg-frog-primary' : 'bg-white/20'} flex-shrink-0`}></div>
                  <div className={`flex items-center ${step >= 2 ? 'text-frog-primary' : 'text-white/40'} flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 2 ? 'bg-frog-primary text-white' : 'glass-strong'
                    }`}>2</div>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Participants</span>
                    <span className="ml-2 text-xs font-medium sm:hidden">Participants</span>
                  </div>
                  <div className={`w-6 sm:w-8 h-1 ${step >= 3 ? 'bg-frog-primary' : 'bg-white/20'} flex-shrink-0`}></div>
                  <div className={`flex items-center ${step >= 3 ? 'text-frog-primary' : 'text-white/40'} flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 3 ? 'bg-frog-primary text-white' : 'glass-strong'
                    }`}>3</div>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Tableau</span>
                    <span className="ml-2 text-xs font-medium sm:hidden">Tableau</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Tournament Configuration */}
              {step === 1 && (
                <div className="space-y-6">
                  <Input
                    label="Nom du tournoi"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={getFieldError('name')}
                    placeholder="Ex: Championnat d'été 2025"
                    required
                    helperText="3-100 caractères"
                  />

                  <Input
                    label="Nombre de participants"
                    type="number"
                    value={formData.participantCount}
                    onChange={(e) => handleInputChange('participantCount', e.target.value)}
                    error={getFieldError('maxParticipants')}
                    placeholder="Ex: 16"
                    min="2"
                    max="128"
                    required
                    helperText="Entre 2 et 128 participants"
                  />

                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Format du tournoi
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start p-4 glass rounded-lg cursor-pointer hover:glass-strong transition-all">
                        <input
                          type="radio"
                          value="fixtures"
                          checked={formData.format === 'fixtures'}
                          onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'fixtures' }))}
                          className="mt-1 mr-3 accent-frog-primary"
                        />
                        <div>
                          <div className="font-medium text-white">Élimination directe</div>
                          <div className="text-sm text-white/80">
                            Matchs directs en élimination simple. Idéal pour des tournois rapides.
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start p-4 glass rounded-lg cursor-pointer hover:glass-strong transition-all">
                        <input
                          type="radio"
                          value="group_stage"
                          checked={formData.format === 'group_stage'}
                          onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'group_stage' }))}
                          className="mt-1 mr-3 accent-frog-primary"
                        />
                        <div>
                          <div className="font-medium text-white">Phase de groupes</div>
                          <div className="text-sm text-white/80">
                            Phase de poules suivie d'une phase à élimination. Plus équitable pour tous les participants.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`input-glass w-full px-3 py-2 rounded-md text-white placeholder-white/60 ${
                        getFieldError('description') ? 'border-red-400' : ''
                      }`}
                      rows={3}
                      placeholder="Décrivez votre tournoi..."
                      maxLength={500}
                    />
                    {getFieldError('description') && (
                      <p className="text-sm text-red-400 mt-1">{getFieldError('description')}</p>
                    )}
                    <p className="text-xs text-white/60 mt-1">Maximum 500 caractères</p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="glass" onClick={handleClose}>
                      Annuler
                    </Button>
                    <Button variant="frog" onClick={generateParticipants}>
                      <Users className="h-4 w-4 mr-2" />
                      Continuer
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Participant Management */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Gestion des participants ({participants.length})
                    </h4>
                    <Button variant="outline" onClick={shuffleParticipants}>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Mélanger
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {participant.seed}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Participant ${participant.seed}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      Retour
                    </Button>
                    <Button onClick={generateBracket}>
                      Générer le tableau
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Bracket Preview */}
              {step === 3 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Aperçu du tableau - {formData.format === 'fixtures' ? 'Élimination directe' : 'Phase de groupes'}
                  </h4>

                  {formData.format === 'group_stage' && groups.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-gray-800 mb-4">Phase de groupes</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groups.map((group) => (
                          <Card key={group.name} className="p-4">
                            <h6 className="font-semibold text-gray-900 mb-2">Groupe {group.name}</h6>
                            <div className="space-y-2">
                              {group.participants.map((participant) => (
                                <div key={participant.id} className="text-sm text-gray-600">
                                  {participant.seed}. {participant.name}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                              {group.matches.length} matchs à jouer
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-4">
                      {formData.format === 'group_stage' ? 'Phase finale' : 'Tableau principal'}
                    </h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid gap-2">
                        {Array.from(new Set(bracket.map(m => m.round))).map(round => (
                          <div key={round} className="mb-4">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">
                              {formData.format === 'group_stage' && round === 1 ? 'Demi-finales' :
                               formData.format === 'group_stage' && round === 2 ? 'Finale' :
                               round === 1 ? 'Premier tour' :
                               round === Math.max(...bracket.map(m => m.round)) ? 'Finale' :
                               `Tour ${round}`}
                            </h6>
                            <div className="space-y-2">
                              {bracket.filter(m => m.round === round).map(match => (
                                <div key={match.id} className="bg-white p-2 rounded border text-sm">
                                  Match {match.matchNumber}: 
                                  {match.participant1 ? ` ${match.participant1.name}` : ' TBD'} vs
                                  {match.participant2 ? ` ${match.participant2.name}` : ' TBD'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      Retour
                    </Button>
                    <Button onClick={createTournament}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le tournoi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </TournamentErrorBoundary>
  );
}