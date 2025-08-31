export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">系統維護：</span>
            <a 
              href="https://bashcat.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              BASHCAT.NET
            </a>
          </div>
          <div className="text-gray-400 text-sm">|</div>
          <div className="flex items-center gap-2">
            <span className="text-sm">聯絡信箱：</span>
            <a 
              href="mailto:Bashcat0804@gmail.com"
              className="text-blue-400 hover:text-blue-300"
            >
              Bashcat0804@gmail.com
            </a>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          © 2024 Discord 直播排麥系統 - Powered by BASHCAT
        </div>
      </div>
    </footer>
  )
}