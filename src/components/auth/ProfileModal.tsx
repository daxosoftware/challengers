import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Shield } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await updateProfile(formData);
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ general: error.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleDisplay = (role: string) => {
    return role === 'organizer' ? 'Organisateur' : 'Joueur';
  };

  const getRoleIcon = (role: string) => {
    return role === 'organizer' ? Shield : User;
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom modal-glass px-4 pt-5 pb-4 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="glass rounded-xl text-white/60 hover:text-frog-primary hover:scale-110 transition-all duration-300 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="text-center mb-6">
                <div className="mx-auto h-20 w-20 bg-gradient-frog-primary rounded-full flex items-center justify-center mb-4 frog-glow">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-white text-gradient-frog">Mon Profil</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-white/80 glass rounded-xl p-3">
                    <Mail className="h-4 w-4 text-frog-primary" />
                    <span>{user.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm text-white/80 glass rounded-xl p-3">
                    <RoleIcon className="h-4 w-4 text-frog-secondary" />
                    <span>{getRoleDisplay(user.role)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm text-white/80 glass rounded-xl p-3">
                    <Calendar className="h-4 w-4 text-frog-accent" />
                    <span>Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <Input
                    label="Nom d'utilisateur"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    error={errors.username}
                    variant="frog"
                    required
                  />

                  <Input
                    label="URL de l'avatar (optionnel)"
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    error={errors.avatar_url}
                    variant="frog"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                {successMessage && (
                  <div className="text-frog-primary text-sm text-center flex items-center justify-center">
                    <div className="w-6 h-6 bg-frog-primary/20 rounded-full flex items-center justify-center mr-2">
                      <span className="text-frog-primary font-bold text-xs">✓</span>
                    </div>
                    {successMessage}
                  </div>
                )}

                {errors.general && (
                  <div className="text-frog-accent text-sm flex items-center">
                    <span className="w-1 h-1 bg-frog-accent rounded-full mr-2"></span>
                    {errors.general}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="frog"
                  className="w-full frog-effect"
                  loading={loading}
                >
                  Mettre à jour le profil
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
