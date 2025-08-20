'use client';

import Link from 'next/link';
import { Zap, Twitter, Github, MessageCircle, Mail } from 'lucide-react';

const footerLinks = {
  Games: [
    { name: 'Plinko', href: '/games/plinko' },
    { name: 'Mines', href: '/games/mines' },
    { name: 'Crash', href: '/games/crash' },
    { name: 'Statistics', href: '/stats' },
  ],
  Platform: [
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Provably Fair', href: '/provably-fair' },
    { name: 'API', href: '/api' },
    { name: 'Affiliate', href: '/affiliate' },
  ],
  Support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Bug Report', href: '/bug-report' },
    { name: 'Feature Request', href: '/feature-request' },
  ],
  Legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Responsible Gaming', href: '/responsible-gaming' },
    { name: 'Licenses', href: '/licenses' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/hyrlqi', icon: Twitter },
  { name: 'Discord', href: 'https://discord.gg/hyrlqi', icon: MessageCircle },
  { name: 'GitHub', href: 'https://github.com/hyrlqi', icon: Github },
  { name: 'Email', href: 'mailto:support@hyrlqi.com', icon: Mail },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Hyrlqi</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              The most elegant gambling platform featuring Plinko, Mines, and Crash games. 
              Provably fair, instant payouts, and industry-leading security.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200 group"
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            <p>&copy; 2024 Hyrlqi. All rights reserved.</p>
            <p className="mt-1">
              Play responsibly. Must be 18+ to play.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>All systems operational</span>
            </div>
            <span>|</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
