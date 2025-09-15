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

// Toast notification utility
export const showErrorToast = (error: any) => {
  const appError = ErrorHandler.handle(error);
  
  // You can integrate with a toast library here
  // For now, we'll use a simple alert
  if (typeof window !== 'undefined') {
    // Check if we're in a browser environment
    console.error('Error:', appError);
    
    // You can replace this with a proper toast notification
    // toast.error(appError.message);
  }
};

// Success notification utility
export const showSuccessToast = (message: string) => {
  if (typeof window !== 'undefined') {
    console.log('Success:', message);
    
    // You can replace this with a proper toast notification
    // toast.success(message);
  }
};
