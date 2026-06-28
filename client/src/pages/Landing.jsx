import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { CheckCircle, Zap, Lock, ArrowRight, MessageSquare, ClipboardList, Lightbulb, Quote } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()

  const subjects = [
    { name: 'Physics', code: '042', color: 'from-blue-500 to-cyan-400', icon: '⚛️', marks: 70 },
    { name: 'Chemistry', code: '043', color: 'from-emerald-500 to-green-400', icon: '🧪', marks: 70 },
    { name: 'Mathematics', code: '041', color: 'from-purple-500 to-pink-400', icon: '📐', marks: 80 },
  ]

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/forge.svg" alt="Forge" className="w-7 h-7" />
            <span className="font-bold text-lg">
              <span className="text-indigo-400">OSM-</span>BRO
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/ask" className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all">
                Go to Study
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all">
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                Stop Getting Marks Cut for{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  'Out of Syllabus'
                </span>{' '}
                Answers
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                Forge knows your CBSE 2026-27 syllabus. Knows OSM marking. Knows what your professor's answer book says.
                <br />
                <span className="text-indigo-400 font-medium">Answers formatted step-by-step, exactly how CBSE wants.</span>
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              {user ? (
                <Link to="/ask" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/25 animate-pulse">
                  Start Studying Free <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/25 animate-pulse">
                  Start Studying Free <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <p className="text-sm text-slate-500 mt-3">No paywall. No app download. Just marks.</p>
            </motion.div>
          </div>

          {/* Visual Comparison */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400 font-bold">✗</span>
                <span className="text-sm font-medium text-red-300">Generic AI (ChatGPT/Gemini)</span>
              </div>
              <p className="text-sm text-red-300/70 italic">"Coulomb's law states that like charges attract..."</p>
              <p className="text-xs text-red-400/50 mt-1">✗ Wrong. This topic was updated in 2026-27 syllabus.</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-sm font-medium text-emerald-300">OSM-BRO Forge</span>
              </div>
              <div className="text-sm text-emerald-300/70 space-y-1">
                <p><span className="text-emerald-400">Step 1:</span> State Coulomb's law [1 mark]</p>
                <p><span className="text-emerald-400">Step 2:</span> F = k(q1q2)/r² [1 mark]</p>
                <p><span className="text-emerald-400">Step 3:</span> Substitute values [1 mark]</p>
              </div>
              <p className="text-xs text-emerald-400/50 mt-1">✓ Full marks — OSM format, syllabus-locked</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professor Story */}
      <section className="border-t border-white/5 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="bg-indigo-900/10 border border-indigo-500/10 rounded-2xl p-6 md:p-8 relative">
            <Quote className="absolute top-4 left-4 w-8 h-8 text-indigo-500/20" />
            <div className="relative z-10">
              <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed mb-4">
                "Last year, our Physics sir never carried a book to class. This year? He's carrying an{' '}
                <span className="text-indigo-400 font-semibold not-italic">ANSWER BOOK</span>.
              </p>
              <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed mb-4">
                Because CBSE introduced{' '}
                <span className="text-amber-400 font-semibold not-italic">OSM — On-Screen Marking</span>.
                The marking scheme changed. Students write one thing, the screen shows something else.
              </p>
              <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed">
                <span className="text-indigo-400 font-semibold not-italic">Even teachers are confused.</span>{' '}
                But Forge isn't."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subject Selector */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">CBSE Class 12 — 2026-27</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjects.map((subj, i) => (
              <motion.div key={subj.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${subj.color} p-[1px] rounded-xl`}>
                <div className="bg-forge-bg rounded-xl p-5 h-full hover:bg-forge-surface-hover transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">{subj.icon}</div>
                  <h3 className="text-lg font-bold mb-1">{subj.name}</h3>
                  <p className="text-sm text-slate-400">{subj.marks} marks theory</p>
                  <p className="text-xs text-slate-500 mt-1">Code {subj.code} • 33 questions</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Syllabus-Locked', desc: 'Answers ONLY from your NCERT textbook. No hallucinations. No outdated content. Every answer verified against CBSE 2026-27 syllabus.' },
              { icon: CheckCircle, title: 'OSM-Ready Answers', desc: 'Step 1 → Step 2 → Step 3 → Full Marks. Every answer formatted for On-Screen Marking with proper units and diagrams.' },
              { icon: Zap, title: 'Assignment Completer', desc: 'Paste 40 questions. Get 40 proper OSM-formatted answers. Not 30 + 10 garbage. If not in syllabus, we tell you.' },
              { icon: MessageSquare, title: 'Ask Anything', desc: 'Type a question, get a step-by-step OSM answer. Physics, Chemistry, or Maths — in English or Tamil.' },
              { icon: ClipboardList, title: 'Question Bank', desc: 'Generate probable exam questions with model answers. Pattern-matched from previous year CBSE papers.' },
              { icon: Lightbulb, title: 'Explain Mode', desc: 'Stuck on a concept? Ask "explain" and get a simple, intuitive breakdown. Like a friend who actually teaches well.' },
            ].map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                <feat.icon className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm mb-2">Used by students at</p>
          <p className="text-xl font-bold text-indigo-300">Chettinad Vidyashram • Class 12</p>
          <p className="text-slate-500 text-sm mt-4">Built by a student, for students. No VCs. No paywalls. Just marks.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to stop losing marks?</h2>
          <p className="text-slate-400 mb-8">Takes 10 seconds. No email required to start.</p>
          {user ? (
            <Link to="/ask" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/25">
              Start Studying <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/25">
              Start Studying Free <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/forge.svg" alt="forge" className="w-5 h-5" />
            <span className="text-slate-400">OSM-BRO Forge V2</span>
          </div>
          <p>CBSE Class 12 Study AI — Chettinad Vidyashram</p>
        </div>
      </footer>
    </div>
  )
}
