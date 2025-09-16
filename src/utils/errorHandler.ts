export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: any): AppError {
    // Supabase errors
    if (error?.code) {
      return this.handleSupabaseError(error);
    }

    // Network errors
    if (error?.message?.includes('fetch')) {
      return {
        message: 'Erreur de connexion. Vérifiez votre connexion internet.',
        code: 'NETWORK_ERROR',
      };
    }

    // Generic errors
    if (error?.message) {
      return {
        message: error.message,
        code: 'GENERIC_ERROR',
      };
    }

    // Unknown errors
    return {
      message: 'Une erreur inattendue s\'est produite.',
      code: 'UNKNOWN_ERROR',
    };
  }

  private static handleSupabaseError(error: any): AppError {
    const errorMap: Record<string, string> = {
      'invalid_credentials': 'Email ou mot de passe incorrect.',
      'email_not_confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
      'weak_password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'email_address_invalid': 'Adresse email invalide.',
      'user_not_found': 'Aucun compte trouvé avec cette adresse email.',
      'email_address_not_authorized': 'Cette adresse email n\'est pas autorisée.',
      'signup_disabled': 'L\'inscription est temporairement désactivée.',
      'email_address_already_registered': 'Un compte existe déjà avec cette adresse email.',
      'invalid_email': 'Adresse email invalide.',
      'password_too_short': 'Le mot de passe doit contenir au moins 6 caractères.',
      'password_mismatch': 'Les mots de passe ne correspondent pas.',
      'invalid_request': 'Requête invalide.',
      'unauthorized': 'Vous n\'êtes pas autorisé à effectuer cette action.',
      'forbidden': 'Accès interdit.',
      'not_found': 'Ressource non trouvée.',
      'conflict': 'Conflit de données.',
      'too_many_requests': 'Trop de requêtes. Veuillez patienter.',
      'internal_server_error': 'Erreur serveur. Veuillez réessayer plus tard.',
    };

    const message = errorMap[error.code] || error.message || 'Une erreur s\'est produite.';
    
    return {
      message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  static getErrorMessage(error: any): string {
    return this.handle(error).message;
  }

  static isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('fetch') ||
           error?.message?.includes('network');
  }

  static isAuthError(error: any): boolean {
    const authErrorCodes = [
      'invalid_credentials',
      'email_not_confirmed',
      'user_not_found',
      'email_address_not_authorized',
      'unauthorized',
    ];
    return authErrorCodes.includes(error?.code);
  }

  static isValidationError(error: any): boolean {
    const validationErrorCodes = [
      'weak_password',
      'email_address_invalid',
      'invalid_email',
      'password_too_short',
      'password_mismatch',
    ];
    return validationErrorCodes.includes(error?.code);
  }
}

// Toast notification utilities
// Note: These functions should be used with the ToastContext
// For direct usage without context, import and use the toast context directly

export const createErrorMessage = (error: any): { title: string; message?: string } => {
  const appError = ErrorHandler.handle(error);
  
  // Create user-friendly error messages
  let title = 'Erreur';
  let message = appError.message;
  
  if (ErrorHandler.isNetworkError(error)) {
    title = 'Problème de connexion';
  } else if (ErrorHandler.isAuthError(error)) {
    title = 'Erreur d\'authentification';
  } else if (ErrorHandler.isValidationError(error)) {
    title = 'Données invalides';
  }
  
  return { title, message };
};

export const createSuccessMessage = (action: string, details?: string): { title: string; message?: string } => {
  const actionMessages: Record<string, string> = {
    'tournament_created': 'Tournoi créé avec succès',
    'tournament_joined': 'Inscription confirmée',
    'tournament_left': 'Désinscription effectuée',
    'profile_updated': 'Profil mis à jour',
    'login': 'Connexion réussie',
    'logout': 'Déconnexion effectuée',
    'signup': 'Compte créé avec succès',
  };
  
  return {
    title: actionMessages[action] || 'Opération réussie',
    message: details
  };
};

// Legacy functions for backward compatibility - these will log warnings
export const showErrorToast = (error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('showErrorToast is deprecated. Use useToast().showError() instead.');
    console.error('Error:', ErrorHandler.handle(error));
  }
};

export const showSuccessToast = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('showSuccessToast is deprecated. Use useToast().showSuccess() instead.');
    console.log('Success:', message);
  }
};
