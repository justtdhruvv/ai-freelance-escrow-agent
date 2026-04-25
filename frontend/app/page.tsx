'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import {
  Shield,
  Bot,
  Zap,
  CheckCircle,
  FileText,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight,
  Lock,
} from 'lucide-react'
import { TokenManager } from './utils/authToken'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (TokenManager.getToken()) {
      router.push('/dashboard')
    } else {
      setReady(true)
    }
  }, [router])

  useEffect(() => {
    if (!ready) return
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [ready])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F1EC]">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
      {/* Keyframe animations for hero blobs */}
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-35px, 40px) scale(1.08); }
          66% { transform: translate(20px, -25px) scale(0.95); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -30px) scale(1.1); }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#111111]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-white' : 'text-[#111111]'}`}>
            EscrowAI
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                scrolled
                  ? 'border-gray-600 text-gray-300 hover:border-white hover:text-white'
                  : 'border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#AD7D56] text-white hover:bg-[#96693F] transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen bg-[#111111] flex flex-col items-center justify-center overflow-hidden pt-20">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-25"
            style={{
              background: 'radial-gradient(circle, #AD7D56 0%, transparent 70%)',
              top: '-10%',
              left: '-10%',
              animation: 'blob1 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #CDB49E 0%, transparent 70%)',
              bottom: '-5%',
              right: '-5%',
              animation: 'blob2 15s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #AD7D56 0%, transparent 70%)',
              top: '40%',
              left: '60%',
              animation: 'blob3 18s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-6xl md:text-8xl font-bold text-white leading-tight mb-6"
          >
            Freelance Work,
            <br />
            <span className="text-[#AD7D56]">Protected by AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Automated escrow, smart SOP generation, and AI-powered quality checks — so you get paid what you deserve.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-[#AD7D56] text-white rounded-xl text-lg font-semibold hover:bg-[#96693F] transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-white/30 text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all text-center"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 text-sm text-gray-400"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#AD7D56]" />
              Escrow Protected
            </span>
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#AD7D56]" />
              AI Verified
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#AD7D56]" />
              Instant Setup
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[#F5F1EC] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4">How EscrowAI Works</h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">Four simple steps to safer, smarter freelancing</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: FileText,
                  title: 'Post Your Project',
                  desc: 'Employer posts a brief. AI generates a full milestone-based SOP automatically.',
                },
                {
                  step: '02',
                  icon: CheckCircle,
                  title: 'Both Parties Approve',
                  desc: 'Freelancer and client review and sign off on milestones before work begins.',
                },
                {
                  step: '03',
                  icon: Bot,
                  title: 'Work Gets Verified',
                  desc: 'AI runs automated quality checks on each milestone submission.',
                },
                {
                  step: '04',
                  icon: Wallet,
                  title: 'Funds Released',
                  desc: 'Escrow pays out automatically upon milestone approval. No delays, no disputes.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-[#CDB49E]/30 hover:shadow-md transition-shadow"
                >
                  <div className="text-5xl font-bold text-[#AD7D56]/25 mb-4 leading-none">{item.step}</div>
                  <item.icon className="w-8 h-8 text-[#AD7D56] mb-4" />
                  <h3 className="text-xl font-bold text-[#111111] mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-[#111111] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything You Need</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                A complete platform for professional freelance collaboration
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Bot,
                  title: 'AI SOP Generation',
                  desc: 'Turns a 2-line brief into a full milestone plan with deadlines, deliverables, and quality criteria.',
                },
                {
                  icon: Shield,
                  title: 'Automated Quality Checks',
                  desc: 'Code, content, and design verification powered by AI before any milestone is approved.',
                },
                {
                  icon: Wallet,
                  title: 'Escrow Wallet',
                  desc: 'Funds held securely in escrow until each milestone passes quality checks.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Dispute Resolution',
                  desc: 'AI-assisted conflict handling with evidence collection and neutral mediation.',
                },
                {
                  icon: TrendingUp,
                  title: 'PFI Score',
                  desc: 'Freelancer reputation scoring based on delivery quality, timeliness, and client ratings.',
                },
                {
                  icon: Users,
                  title: 'Role-Based Access',
                  desc: 'Separate, purpose-built views for employers and freelancers — no confusion, no clutter.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] hover:border-[#AD7D56]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#AD7D56]/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-[#AD7D56]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── FOR EMPLOYERS / FOR FREELANCERS ── */}
      <section className="bg-[#F5F1EC] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Employers */}
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-2xl p-10 shadow-sm border border-[#CDB49E]/30"
              >
                <div className="inline-block bg-[#AD7D56]/10 text-[#AD7D56] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                  For Employers
                </div>
                <h3 className="text-3xl font-bold text-[#111111] mb-6">Hire with confidence</h3>
                <ul className="space-y-4">
                  {[
                    'Post a brief and get an AI-generated SOP with milestones in seconds',
                    'Only release funds when work passes automated quality checks',
                    'Track progress in real-time with milestone dashboards',
                  ].map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#AD7D56] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/signup')}
                  className="mt-8 flex items-center gap-2 text-[#AD7D56] font-semibold hover:gap-3 transition-all group"
                >
                  Start hiring <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              {/* Freelancers */}
              <motion.div variants={fadeInUp} className="bg-[#111111] rounded-2xl p-10">
                <div className="inline-block bg-[#AD7D56]/20 text-[#AD7D56] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                  For Freelancers
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">Get paid what you deserve</h3>
                <ul className="space-y-4">
                  {[
                    'Funds are escrowed before you start — payment is guaranteed on approval',
                    'Build your PFI reputation score to unlock higher-value projects',
                    'AI quality checks give you objective feedback before submission',
                  ].map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#AD7D56] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/signup')}
                  className="mt-8 flex items-center gap-2 text-[#AD7D56] font-semibold hover:gap-3 transition-all group"
                >
                  Start earning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#AD7D56] py-24 px-6">
        <Section>
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to work smarter?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/80 text-xl mb-10">
              Join EscrowAI today — free for your first project.
            </motion.p>
            <motion.button
              variants={fadeInUp}
              onClick={() => router.push('/signup')}
              className="px-10 py-4 bg-white text-[#AD7D56] rounded-xl text-lg font-bold hover:bg-gray-50 transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Create Free Account
            </motion.button>
          </div>
        </Section>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111111] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-white font-bold text-xl">EscrowAI</span>
          <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">
              Login
            </button>
            <button onClick={() => router.push('/signup')} className="hover:text-white transition-colors">
              Sign Up
            </button>
          </div>
          <p className="text-gray-500 text-sm text-center md:text-right">
            © 2026 EscrowAI. Built for the future of freelancing.
          </p>
        </div>
      </footer>
    </div>
  )
}
