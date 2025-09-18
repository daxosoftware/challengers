import React, { useState, useCallback, useEffect } from 'react';
import { X, ArrowLeft, Shield } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Validator, ValidationSchemas, DataSanitizer, RateLimiter, CSRFProtection } from '../../utils/validation';
import { AuthErrorBoundary } from '../ErrorBoundary';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'player' as 'organizer' | 'player',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [sessionSecure, setSessionSecure] = useState(true);

  const { signIn, signUp, resetPassword, verifyCSRF, getSessionSecurity } = useAuth();

  // Move useCallback hooks before conditional return to ensure they're always called
  const handleInputChange = useCallback((field: string, value: string) => {
    // Clear rate limit when user starts typing
    if (isRateLimited) {
      setIsRateLimited(false);
      setRateLimitTime(0);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, validationErrors, isRateLimited]);
  
  // Real-time validation helper
  const getFieldError = useCallback((field: string) => {
    return validationErrors[field] || errors[field];
  }, [validationErrors, errors]);

  // Initialize CSRF protection and monitor session security
  useEffect(() => {
    if (isOpen) {
      // Get or generate CSRF token
      const token = CSRFProtection.getToken();
      setCSRFToken(token);
      
      // Check session security
      const sessionCheck = getSessionSecurity();
      setSessionSecure(sessionCheck.valid);
      
      if (!sessionCheck.valid && sessionCheck.reason) {
        console.warn(`Session security issue: ${sessionCheck.reason}`);
      }
    }
  }, [isOpen, getSessionSecurity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CSRF token if available
    if (csrfToken && !verifyCSRF(csrfToken)) {
      setErrors({ general: 'Session de sécurité expirée. Veuillez rafraîchir la page.' });
      return;
    }
    
    // Check session security
    const sessionCheck = getSessionSecurity();
    if (!sessionCheck.valid) {
      setErrors({ general: 'Session invalide. Veuillez rafraîchir la page.' });
      setSessionSecure(false);
      return;
    }
    
    // Enhanced rate limiting with different limits per action
    const rateLimitKey = `auth_${formData.email}_${tab}`;
    const maxAttempts = tab === 'login' ? 5 : 3; // More restrictive for signup
    const windowMs = tab === 'login' ? 15 * 60 * 1000 : 60 * 60 * 1000; // 15min for login, 1hr for signup
    
    const rateLimitResult = RateLimiter.isAllowed(rateLimitKey, maxAttempts, windowMs);
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      setRateLimitTime(rateLimitResult.resetTime - Date.now());
      const timeDisplay = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
      setErrors({ 
        general: `Trop de tentatives de ${tab === 'login' ? 'connexion' : 'inscription'}. Réessayez dans ${timeDisplay} minute${timeDisplay > 1 ? 's' : ''}.` 
      });
      return;
    }
    
    setLoading(true);
    setErrors({});
    setValidationErrors({});
    setIsRateLimited(false);
    
    // Sanitize input data
    const sanitizedData = DataSanitizer.sanitizeObject(formData, {
      email: 'email',
      password: 'string',
      username: 'string',
      role: 'string',
    });
    
    // Validate input
    const validation = Validator.validate(sanitizedData, ValidationSchemas.auth);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      if (tab === 'login') {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.username, formData.role);
      }
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CSRF token
    if (csrfToken && !verifyCSRF(csrfToken)) {
      setErrors({ general: 'Session de sécurité expirée. Veuillez rafraîchir la page.' });
      return;
    }
    
    // Enhanced rate limiting for password reset (more restrictive)
    const rateLimitKey = `reset_${formData.email}`;
    const rateLimitResult = RateLimiter.isAllowed(rateLimitKey, 2, 60 * 60 * 1000); // 2 attempts per hour
    
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      setRateLimitTime(rateLimitResult.resetTime - Date.now());
      const timeDisplay = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
      setErrors({ 
        general: `Trop de tentatives de réinitialisation. Réessayez dans ${timeDisplay} minute${timeDisplay > 1 ? 's' : ''}.` 
      });
      return;
    }
    
    setLoading(true);
    setErrors({});
    setValidationErrors({});
    
    // Validate email
    const emailValidation = Validator.validate({ email: formData.email }, { email: ValidationSchemas.auth.email });
    if (!emailValidation.isValid) {
      setValidationErrors(emailValidation.errors);
      setLoading(false);
      return;
    }
    
    const sanitizedEmail = DataSanitizer.sanitizeEmail(formData.email);

    try {
      await resetPassword(sanitizedEmail);
      setResetEmailSent(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  // Rate limit display helper
  const formatRateLimitTime = (ms: number) => {
    const minutes = Math.ceil(ms / 60000);
    return minutes > 1 ? `${minutes} minutes` : '1 minute';
  };

  return (
    <AuthErrorBoundary>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
          </div>

        <div className="inline-block align-bottom modal-glass px-4 pt-5 pb-4 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6 relative z-10">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="glass rounded-xl text-white/60 hover:text-frog-primary hover:scale-110 transition-all duration-300 p-2 relative z-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {showResetPassword ? (
                <div>
                  <div className="flex items-center mb-6">
                    <button
                      onClick={() => setShowResetPassword(false)}
                      className="mr-2 p-1 text-white/60 hover:text-frog-primary hover:scale-110 transition-all duration-300"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-medium text-white text-gradient-frog">
                      Réinitialiser le mot de passe
                    </h3>
                  </div>

                  {resetEmailSent ? (
                    <div className="text-center py-4">
                      <div className="text-frog-primary mb-2 flex items-center justify-center">
                        <div className="w-8 h-8 bg-frog-primary/20 rounded-full flex items-center justify-center mr-2">
                          <span className="text-frog-primary font-bold">✓</span>
                        </div>
                        Email envoyé avec succès
                      </div>
                      <p className="text-sm text-white/70 mb-4">
                        Vérifiez votre boîte de réception pour les instructions de réinitialisation.
                      </p>
                      <Button
                        variant="frog"
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetEmailSent(false);
                        }}
                        className="w-full frog-effect"
                      >
                        Retour à la connexion
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        error={getFieldError('email')}
                        variant="frog"
                        required
                        disabled={loading}
                      />

                      {(errors.general || isRateLimited) && (
                        <div className="text-frog-accent text-sm flex items-center">
                          <span className="w-1 h-1 bg-frog-accent rounded-full mr-2"></span>
                          {isRateLimited 
                            ? `Trop de tentatives. Réessayez dans ${formatRateLimitTime(rateLimitTime)}.`
                            : errors.general
                          }
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="frog"
                        className="w-full frog-effect"
                        loading={loading}
                        disabled={loading || isRateLimited}
                      >
                        Envoyer l'email de réinitialisation
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex space-x-1 mb-6 glass rounded-xl p-1">
                    <button
                      onClick={() => setTab('login')}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                        tab === 'login'
                          ? 'bg-gradient-frog-primary text-white shadow-lg'
                          : 'text-white/70 hover:text-frog-primary hover:bg-white/10'
                      }`}
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => setTab('signup')}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                        tab === 'signup'
                          ? 'bg-gradient-frog-primary text-white shadow-lg'
                          : 'text-white/70 hover:text-frog-primary hover:bg-white/10'
                      }`}
                    >
                      S'inscrire
                    </button>
                  </div>

                  {/* Security Status Indicator */}
                  <div className="mb-4 p-3 glass rounded-xl border border-white/10">
                    <div className="flex items-center text-xs text-white/70">
                      <Shield className="h-3 w-3 mr-2 text-frog-primary" />
                      <span className="flex-1">Connexion sécurisée</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${csrfToken ? 'bg-green-400' : 'bg-red-400'}`} title="Protection CSRF" />
                        <div className={`w-2 h-2 rounded-full ${sessionSecure ? 'bg-green-400' : 'bg-red-400'}`} title="Sécurité de session" />
                      </div>
                    </div>
                  </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'signup' && (
                  <>
                    <Input
                      label="Nom d'utilisateur"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      error={getFieldError('username')}
                      variant="frog"
                      required
                      disabled={loading}
                      helperText="3-20 caractères, lettres, chiffres, - et _ autorisés"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-3">
                        Type de compte
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center glass rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all duration-300">
                          <input
                            type="radio"
                            value="player"
                            checked={formData.role === 'player'}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="mr-3 w-4 h-4 text-frog-primary focus:ring-frog-glow"
                          />
                          <span className="text-sm text-white/90">Joueur</span>
                        </label>
                        <label className="flex items-center glass rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all duration-300">
                          <input
                            type="radio"
                            value="organizer"
                            checked={formData.role === 'organizer'}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="mr-3 w-4 h-4 text-frog-primary focus:ring-frog-glow"
                          />
                          <span className="text-sm text-white/90">Organisateur</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={getFieldError('email')}
                  variant="frog"
                  required
                  disabled={loading}
                />

                <Input
                  label="Mot de passe"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={getFieldError('password')}
                  variant="frog"
                  required
                  disabled={loading}
                  helperText={tab === 'signup' ? 'Minimum 8 caractères avec majuscule, minuscule et chiffre' : undefined}
                />

                {tab === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-sm text-frog-primary hover:text-frog-secondary transition-colors duration-300 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                {(errors.general || isRateLimited) && (
                  <div className="text-frog-accent text-sm flex items-center">
                    <span className="w-1 h-1 bg-frog-accent rounded-full mr-2"></span>
                    {isRateLimited 
                      ? `Trop de tentatives. Réessayez dans ${formatRateLimitTime(rateLimitTime)}.`
                      : errors.general
                    }
                  </div>
                )}

                <Button
                  type="submit"
                  variant="frog"
                  className="w-full frog-effect"
                  loading={loading}
                  disabled={loading || isRateLimited}
                >
                  {tab === 'login' ? 'Se connecter' : "S'inscrire"}
                </Button>
              </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthErrorBoundary>
  );
}