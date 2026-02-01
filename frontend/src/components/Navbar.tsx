'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-medium text-gray-900">
          <Music className="w-6 h-6 text-blue-500" />
          <span>音乐教师音频社区</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/library" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            音频库
          </Link>
          <Link href="/visualization" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            可视化工作室
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            课件中心
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            创作者中心
          </Link>
        </div>
      </div>
    </nav>
  );
}
