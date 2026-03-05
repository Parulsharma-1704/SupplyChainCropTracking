export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-5">
            <div className="flex gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-green-600 slide-left-right" style={{ animationDelay: '0s' }}></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-600 slide-left-right" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-600 slide-left-right" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-green-700 text-lg font-medium tracking-wider pulse">Loading...</p>
        </div>
    );
}
