'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Star, 
  ArrowRight,
  Play,
  Target,
  Bomb
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const games = [
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Watch the ball bounce through pegs and land on multipliers up to 1000x',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    features: ['Physics-based gameplay', 'Multiple risk levels', 'Up to 1000x multiplier'],
    maxMultiplier: '1000x',
  },
  {
    id: 'mines',
    name: 'Mines',
    description: 'Navigate through a minefield to find gems and cash out before hitting a mine',
    icon: Bomb,
    color: 'from-purple-500 to-pink-500',
    features: ['Strategic gameplay', 'Customizable difficulty', 'High risk, high reward'],
    maxMultiplier: '5000x',
  },
  {
    id: 'crash',
    name: 'Crash',
    description: 'Watch the multiplier climb and cash out before it crashes',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    features: ['Real-time multiplayer', 'Auto cash-out', 'Infinite potential'],
    maxMultiplier: '∞',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Provably Fair',
    description: 'Every game result is cryptographically verifiable, ensuring complete transparency and fairness.',
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Lightning-fast withdrawals with no delays. Your winnings are available immediately.',
  },
  {
    icon: Users,
    title: 'Live Multiplayer',
    description: 'Play alongside thousands of other players in real-time with live chat and statistics.',
  },
  {
    icon: Star,
    title: 'Premium Experience',
    description: 'Industry-leading design, smooth animations, and intuitive gameplay.',
  },
];

const stats = [
  { label: 'Players Online', value: '12,847', change: '+23%' },
  { label: 'Games Played', value: '2.1M', change: '+45%' },
  { label: 'Total Payouts', value: '$15.2M', change: '+67%' },
  { label: 'Average RTP', value: '99%', change: 'Fair' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="gradient-text-primary">Premium</span>{' '}
                <span className="text-white">Gambling</span>
                <br />
                <span className="gradient-text-secondary">Experience</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Experience the thrill of Plinko, Mines, and Crash games on the most elegant 
                gambling platform. Provably fair, instant payouts, and industry-leading security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {user ? (
                  <button
                    onClick={() => router.push('/games')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 btn-hover hover:scale-105 transform"
                  >
                    <Play className="w-5 h-5" />
                    Play Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push('/auth/register')}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 btn-hover hover:scale-105 transform"
                    >
                      Start Playing
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 transform"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="glass-dark rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                    <div className="text-xs text-green-400">{stat.change}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Choose Your <span className="gradient-text">Game</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Three unique games, each with their own strategy and excitement. 
              All powered by provably fair mathematics.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="glass-dark rounded-2xl p-8 card-hover group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${game.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <game.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-white">{game.name}</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">{game.description}</p>

                <div className="space-y-3 mb-6">
                  {game.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-400">Max Multiplier</span>
                  <span className={`text-lg font-bold bg-gradient-to-r ${game.color} bg-clip-text text-transparent`}>
                    {game.maxMultiplier}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(user ? `/games/${game.id}` : '/auth/register')}
                  className={`w-full py-3 bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2`}
                >
                  <Play className="w-4 h-4" />
                  Play {game.name}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Why Choose <span className="gradient-text">Hyrlqi</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              We've built the most advanced gambling platform with cutting-edge technology 
              and user-centric design.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="glass-dark rounded-2xl p-6 text-center card-hover"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-green-900/20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Win Big</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of players already winning on Hyrlqi. 
              Start with $1000 free credits and experience the thrill.
            </p>
            
            {!user && (
              <button
                onClick={() => router.push('/auth/register')}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 btn-hover hover:scale-105 transform"
              >
                Get Started Now
              </button>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
