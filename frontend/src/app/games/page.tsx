'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Target, Bomb, TrendingUp, Play, Trophy, Clock, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const games = [
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop the ball and watch it bounce through pegs to land on multipliers up to 1000x your bet.',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    features: ['Physics-based gameplay', 'Multiple risk levels', 'Up to 1000x multiplier'],
    maxMultiplier: '1000x',
    minBet: '$0.01',
    avgRound: '5s',
    rtp: '99%',
    difficulty: 'Easy',
  },
  {
    id: 'mines',
    name: 'Mines',
    description: 'Navigate through a minefield to find gems. Cash out anytime or risk it all for bigger rewards.',
    icon: Bomb,
    color: 'from-purple-500 to-pink-500',
    features: ['Strategic gameplay', 'Customizable difficulty', 'Cash out anytime'],
    maxMultiplier: '5000x',
    minBet: '$0.01',
    avgRound: '30s',
    rtp: '99%',
    difficulty: 'Medium',
  },
  {
    id: 'crash',
    name: 'Crash',
    description: 'Watch the multiplier climb and cash out before it crashes. Real-time multiplayer excitement.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    features: ['Real-time multiplayer', 'Auto cash-out', 'Infinite potential'],
    maxMultiplier: '∞',
    minBet: '$0.01',
    avgRound: '15s',
    rtp: '99%',
    difficulty: 'Hard',
  },
];

const stats = [
  { label: 'Games Played Today', value: '15,247', icon: Play },
  { label: 'Biggest Win', value: '$125,000', icon: Trophy },
  { label: 'Players Online', value: '3,847', icon: Clock },
  { label: 'Total Payouts', value: '$2.4M', icon: DollarSign },
];

export default function GamesPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Choose Your <span className="gradient-text">Game</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Welcome back, <span className="text-blue-400 font-semibold">{user?.username}</span>! 
            Ready to test your luck with our provably fair games?
          </motion.p>

          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="inline-flex items-center space-x-2 bg-green-900/20 border border-green-500/20 rounded-xl px-6 py-3"
          >
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-bold text-lg">
              ${parseFloat(user?.balance || '0').toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm">Available</span>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="glass-dark rounded-xl p-4 text-center"
            >
              <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="glass-dark rounded-2xl overflow-hidden card-hover group"
            >
              {/* Game Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${game.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <game.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Difficulty</div>
                    <div className={`text-sm font-semibold ${
                      game.difficulty === 'Easy' ? 'text-green-400' :
                      game.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {game.difficulty}
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 text-white">{game.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{game.description}</p>

                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Max Win</div>
                    <div className={`font-bold bg-gradient-to-r ${game.color} bg-clip-text text-transparent`}>
                      {game.maxMultiplier}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">RTP</div>
                    <div className="font-bold text-green-400">{game.rtp}</div>
                  </div>
                </div>

                {/* Game Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Min Bet:</span>
                    <span className="text-white">{game.minBet}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Round:</span>
                    <span className="text-white">{game.avgRound}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {game.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <div className="p-6 pt-0">
                <Link href={`/games/${game.id}`}>
                  <button
                    className={`w-full py-3 bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 btn-hover hover:scale-102 transform`}
                  >
                    <Play className="w-4 h-4" />
                    Play {game.name}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Live <span className="gradient-text">Activity</span>
          </h2>
          
          <div className="glass-dark rounded-2xl p-6">
            <div className="space-y-3">
              {[
                { user: 'CryptoKing', game: 'Plinko', win: '$1,247', multiplier: '124.7x' },
                { user: 'LuckyPlayer', game: 'Mines', win: '$892', multiplier: '44.6x' },
                { user: 'HighRoller', game: 'Crash', win: '$2,156', multiplier: '215.6x' },
                { user: 'WinnerWinner', game: 'Plinko', win: '$567', multiplier: '56.7x' },
                { user: 'DiamondHands', game: 'Mines', win: '$1,893', multiplier: '94.6x' },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white font-medium">{activity.user}</span>
                      <span className="text-gray-400 text-sm ml-2">won on {activity.game}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{activity.win}</div>
                    <div className="text-gray-400 text-sm">{activity.multiplier}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
