import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div>
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Built for students. Proven by results.
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-forge-300 to-forge-500 bg-clip-text text-transparent">
          Stop Applying.<br />Start Proving.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
          Every internship you apply to gets 500+ applicants. Standing out isn't about 
          your resume — it's about proof. Solve real company problems, get evaluated 
          like a real employee, and build a capability profile that companies can't ignore.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {user ? (
            <Link to="/dashboard" className="bg-forge-600 hover:bg-forge-500 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg shadow-forge-600/20">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="bg-forge-600 hover:bg-forge-500 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg shadow-forge-600/20">
                Start Free
              </Link>
              <Link to="/login" className="border border-gray-600 hover:border-gray-400 px-8 py-3 rounded-lg text-lg transition">
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">What Companies Actually Test</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          We don't care about your marks. We measure what hiring managers actually look for.
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { title: 'Wrong & Recovered', desc: 'Can you admit when you are wrong and fix it? Companies love people who pivot fast.', color: 'from-red-500 to-orange-500', icon: '🔄' },
            { title: 'Pressure Communication', desc: 'When things get tough, do you communicate clearly or panic?', color: 'from-blue-500 to-cyan-500', icon: '💬' },
            { title: 'Mid-Process Pivot', desc: 'When the problem changes halfway, do you adapt or break down?', color: 'from-purple-500 to-pink-500', icon: '🎯' },
            { title: 'Unblocking Agency', desc: 'Do you figure things out yourself or wait for someone to tell you?', color: 'from-green-500 to-emerald-500', icon: '🚀' },
          ].map(d => (
            <div key={d.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition group">
              <div className="text-2xl mb-3">{d.icon}</div>
              <div className={`h-2 w-16 rounded bg-gradient-to-r ${d.color} mb-4 group-hover:w-24 transition-all`} />
              <h3 className="text-lg font-semibold mb-2">{d.title}</h3>
              <p className="text-gray-400 text-sm">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Pick a Challenge', desc: 'Choose from real company problems. 3 difficulty levels. Start anywhere.', icon: '🎯' },
              { step: '2', title: 'Solve It Your Way', desc: 'Work through it at your own pace. Stuck? Your AI tutor is always there.', icon: '🧠' },
              { step: '3', title: 'Get Evaluated', desc: 'Our AI scores you on the 4 dimensions. Real feedback. Not generic fluff.', icon: '📊' },
              { step: '4', title: 'Share Your Profile', desc: 'Get a shareable capability profile. Send it to companies instead of a resume.', icon: '🚀' },
            ].map(d => (
              <div key={d.step} className="text-center">
                <div className="text-3xl mb-3">{d.icon}</div>
                <div className="w-12 h-12 bg-forge-600/20 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3 text-forge-400">{d.step}</div>
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <p className="text-gray-400 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Your 4-Week Transformation</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Week 1: Build confidence with daily challenges. Week 2: Tackle full simulations. 
          Week 3: Master pressure with time-bound problems. Week 4: Get your capability profile 
          and start sending it to companies.
        </p>
        {!user && (
          <Link to="/register" className="bg-forge-600 hover:bg-forge-500 px-8 py-3 rounded-lg text-lg font-semibold transition inline-block">
            Join Free
          </Link>
        )}
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        The Forge · Built by students, for students · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
