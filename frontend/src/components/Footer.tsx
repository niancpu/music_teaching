export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-12 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">&copy; 2025 音乐教师音频社区</p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">帮助</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">隐私政策</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">服务条款</a>
        </div>
      </div>
    </footer>
  );
}
