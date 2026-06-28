import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Target, Brain, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Landing() {
  const { user } = useAuth()

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-forge-accent/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass rounded-pill px-4 py-1.5 text-xs text-forge-text-secondary mb-8"
          >
            <span className="w-2 h-2 bg-forge-success rounded-full animate-pulse" />
            Built for students. Proven by results.
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 gradient-text"
          >
            Stop Applying.<br />Start Proving.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forge-text-secondary mb-10 max-w-3xl mx-auto"
          >
            Every internship gets 500+ applicants. Standing out isn't about your resume —
            it's about proof. Solve real company problems, get evaluated like a real employee,
            and build a capability profile that companies can't ignore.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Start Free — No Credit Card
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* 4 Dimensions */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-display font-bold mb-4">What Companies Actually Test</h2>
          <p className="text-forge-text-secondary max-w-2xl mx-auto">
            We don't care about your marks. We measure what hiring managers actually look for.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { title: 'Wrong & Recovered', desc: 'Can you admit when you\'re wrong and fix it? Companies love people who pivot fast.', color: 'from-red-500 to-orange-500', icon: '🔄' },
            { title: 'Pressure Communication', desc: 'When things get tough, do you communicate clearly or panic?', color: 'from-blue-500 to-cyan-500', icon: '💬' },
            { title: 'Mid-Process Pivot', desc: 'When the problem changes halfway, do you adapt or break down?', color: 'from-purple-500 to-pink-500', icon: '🎯' },
            { title: 'Unblocking Agency', desc: 'Do you figure things out yourself or wait for someone to tell you?', color: 'from-green-500 to-emerald-500', icon: '🚀' },
          ].map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center hover:border-white/[0.12] transition-all duration-300">
                <div className="text-3xl mb-3">{d.icon}</div>
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${d.color} mx-auto mb-3`} />
                <h3 className="text-lg font-semibold mb-2 font-display">{d.title}</h3>
                <p className="text-forge-text-secondary text-sm">{d.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-forge-accent/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Pick a Challenge', desc: 'Choose from real company problems. 3 levels — start anywhere.', icon: Target },
              { step: '02', title: 'Solve Your Way', desc: 'Work at your own pace. AI tutor is always there when you\'re stuck.', icon: Brain },
              { step: '03', title: 'Get Evaluated', desc: 'AI scores you on 4 dimensions. Real feedback, not generic fluff.', icon: BarChart3 },
              { step: '04', title: 'Share Your Profile', desc: 'Get a shareable capability profile. Send to companies instead of a resume.', icon: Zap },
            ].map((d, i) => (
              <motion.div
                key={d.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-accent/20 to-forge-cyan/20 flex items-center justify-center mx-auto mb-4">
                  <d.icon className="w-6 h-6 text-forge-accent" />
                </div>
                <div className="text-sm text-forge-accent font-mono mb-1">{d.step}</div>
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <p className="text-forge-text-secondary text-sm">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Week Transformation */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold mb-4">Your 4-Week Transformation</h2>
          <p className="text-forge-text-secondary mb-8 max-w-2xl mx-auto">
            Week 1: Build confidence with daily challenges. Week 2: Tackle full simulations.
            Week 3: Master pressure with time-bound problems. Week 4: Get your capability profile
            and start sending it to companies.
          </p>
          {!user && (
            <Link to="/register">
              <Button variant="primary" size="lg">
                Join Free
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-forge-text-muted text-sm">
        The Forge · Built by students, for students · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
