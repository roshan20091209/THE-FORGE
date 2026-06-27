import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div>
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-forge-300 to-forge-500 bg-clip-text text-transparent">
          Prove Your Worth.<br />Skip the Internship.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
          The Forge replaces 3-month internships with 72-hour high-stakes simulations.
          Build real solutions under pressure. Get a verifiable credential that proves
          the 4 dimensions hiring managers actually care about.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-forge-600 hover:bg-forge-500 px-8 py-3 rounded-lg text-lg font-semibold transition">
            Start Your First Simulation
          </Link>
          <Link to="/simulations" className="border border-gray-600 hover:border-gray-400 px-8 py-3 rounded-lg text-lg transition">
            Browse Simulations
          </Link>
        </div>
      </section>

      <section className="max-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">The 4 Dimensions We Measure</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { title: 'Wrong & Recovered', desc: 'Speed of pivot when your first approach fails. We log your iteration history.', color: 'from-red-500 to-orange-500' },
            { title: 'Pressure Communication', desc: 'Quality of questions and clarity of updates under time constraints.', color: 'from-blue-500 to-cyan-500' },
            { title: 'Mid-Process Pivot', desc: 'Response to crisis injections. Defensive or adaptive?', color: 'from-purple-500 to-pink-500' },
            { title: 'Unblocking Agency', desc: 'Self-direction. How you get unstuck without asking for help.', color: 'from-green-500 to-emerald-500' },
          ].map(d => (
            <div key={d.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition">
              <div className={`h-2 w-16 rounded bg-gradient-to-r ${d.color} mb-4`} />
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
              { step: '1', title: 'Pick a Simulation', desc: 'Choose from real-world problems in Tech, Data, Product, and more.' },
              { step: '2', title: 'Solve Under Pressure', desc: '72-hour countdown. Your AI manager sets the stage. Crisis events test your adaptability.' },
              { step: '3', title: 'Get Scored', desc: 'AI evaluation + peer review across 4 dimensions. See your percentile ranking.' },
              { step: '4', title: 'Share Your Credential', desc: 'A verifiable 1-page profile with radar chart, evidence clips, and a shareable link.' },
            ].map(d => (
              <div key={d.step} className="text-center">
                <div className="w-12 h-12 bg-forge-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">{d.step}</div>
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <p className="text-gray-400 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} The Forge. Built on a $0 tech stack.
      </footer>
    </div>
  )
}
