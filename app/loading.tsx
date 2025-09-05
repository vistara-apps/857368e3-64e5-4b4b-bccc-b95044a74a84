export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
          <span className="text-white font-bold text-xl">LL</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/20 rounded w-48 mx-auto animate-pulse"></div>
          <div className="h-3 bg-white/10 rounded w-32 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
