import React from 'react';
import { 
  Trophy, 
  Users, 
  BarChart3, 
  MessageCircle, 
  Shield, 
  Smartphone,
  Clock,
  Settings
} from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Trophy,
      title: 'Formats de tournois complets',
      description: 'Élimination simple, double élimination, round robin et formats personnalisés pour tous types de compétitions.',
      color: 'text-yellow-600',
    },
    {
      icon: Users,
      title: 'Gestion des participants',
      description: 'Inscriptions automatisées, validation des participants et système de seeding avancé.',
      color: 'text-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Statistiques avancées',
      description: 'Historique détaillé, analytics en temps réel et rapports personnalisés pour vos tournois.',
      color: 'text-green-600',
    },
    {
      icon: MessageCircle,
      title: 'Communication intégrée',
      description: 'Chat en temps réel, notifications automatiques et annonces pour garder tous vos participants informés.',
      color: 'text-purple-600',
    },
    {
      icon: Shield,
      title: 'Sécurité et fiabilité',
      description: 'Données protégées, sauvegarde automatique et infrastructure haute disponibilité.',
      color: 'text-red-600',
    },
    {
      icon: Smartphone,
      title: 'Responsive design',
      description: 'Interface optimisée pour tous les appareils - ordinateur, tablette et mobile.',
      color: 'text-indigo-600',
    },
    {
      icon: Clock,
      title: 'Temps réel',
      description: 'Mise à jour instantanée des résultats, tableaux dynamiques et synchronisation en direct.',
      color: 'text-orange-600',
    },
    {
      icon: Settings,
      title: 'Personnalisation avancée',
      description: 'Règles personnalisables, branding de tournoi et options de configuration flexibles.',
      color: 'text-teal-600',
    },
  ];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 text-gradient-frog">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Une plateforme complète avec tous les outils nécessaires pour organiser 
            des tournois professionnels et engageants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card-glass p-6 rounded-2xl hover:card-frog transition-all duration-300">
              <div className={`w-12 h-12 rounded-lg glass-strong flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}