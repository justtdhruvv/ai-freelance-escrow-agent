import { ArrowRight, Shield, Zap, Users, CheckCircle, Github, Mail, Brain, DollarSign, AlertTriangle, Lock, Star, ChevronRight } from 'lucide-react'


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                AI-FREELANCE-ESCROW
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#security" className="text-slate-300 hover:text-white transition-colors">Security</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
              <button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI-Powered Escrow for Freelancers
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Secure payments, automated milestones, and AI dispute resolution for freelance work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="border border-slate-600 hover:border-slate-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200">
                Watch Demo
              </button>
            </div>
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>10K+ Projects Protected</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span>$5M+ Payments Secured</span>
              </div>
            </div>
          </div>
          {/* Product Preview */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Escrow Balance</span>
                    <DollarSign className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">$12,500.00</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Active Projects</span>
                    <Users className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">8</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">AI Confidence</span>
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">98%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Trusted by Freelancers Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-400 mb-2">10,000+</div>
              <div className="text-slate-300">Projects Protected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">$5M+</div>
              <div className="text-slate-300">Payments Secured</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-slate-300">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to secure freelance payments with AI intelligence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-indigo-500 transition-all duration-200">
              <Brain className="h-12 w-12 text-indigo-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Smart Escrow</h3>
              <p className="text-slate-300">Intelligent escrow management that adapts to project complexity and risk factors.</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition-all duration-200">
              <Zap className="h-12 w-12 text-cyan-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automated Milestones</h3>
              <p className="text-slate-300">Seamlessly release payments as milestones are completed with smart automation.</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-all duration-200">
              <AlertTriangle className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Dispute Resolution</h3>
              <p className="text-slate-300">Resolve conflicts fairly and quickly using advanced AI arbitration algorithms.</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-all duration-200">
              <Shield className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fraud Detection</h3>
              <p className="text-slate-300">Advanced fraud detection system protects all parties from malicious activities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-300">Simple, secure, and automated process</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Client Deposits Funds</h3>
              <p className="text-slate-300">Client securely deposits payment into AI-monitored escrow account</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-cyan-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Freelancer Delivers</h3>
              <p className="text-slate-300">Freelancer completes project milestones with progress tracking</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Releases Payment</h3>
              <p className="text-slate-300">AI verifies completion and automatically releases funds securely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Modern Dashboard</h2>
            <p className="text-xl text-slate-300">Intuitive interface for managing all your escrow transactions</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                    Escrow Balance
                  </h4>
                  <div className="text-3xl font-bold text-green-400">$12,500.00</div>
                  <div className="text-sm text-slate-400 mt-2">Available for release</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="h-5 w-5 text-cyan-500 mr-2" />
                    Active Contracts
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Website Development</span>
                      <span className="text-green-400">85% Complete</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mobile App Design</span>
                      <span className="text-yellow-400">60% Complete</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Brain className="h-5 w-5 text-purple-500 mr-2" />
                    AI Insights
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Milestone 3 verified</span>
                    </div>
                    <div className="flex items-center text-yellow-400">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Review pending for Milestone 4</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 px-4 py-2 rounded-lg font-medium transition-all duration-200">
                      Release Payment
                    </button>
                    <button className="w-full border border-slate-600 hover:border-slate-500 px-4 py-2 rounded-lg font-medium transition-all duration-200">
                      Dispute Resolution
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bank-Level Security</h2>
            <p className="text-xl text-slate-300">Your money and data are protected by enterprise-grade security</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Lock className="h-16 w-16 text-indigo-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Encrypted Transactions</h3>
              <p className="text-slate-300">All payments are encrypted end-to-end with 256-bit SSL encryption</p>
            </div>
            <div className="text-center">
              <Shield className="h-16 w-16 text-cyan-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">AI Fraud Detection</h3>
              <p className="text-slate-300">Advanced AI algorithms detect and prevent fraudulent activities</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Escrow Protection</h3>
              <p className="text-slate-300">Funds are held securely until project completion is verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Build Trust in Freelance Payments</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of freelancers and clients who trust our AI-powered escrow system
          </p>
          <button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 mx-auto">
            <span>Start Using AI Escrow</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-indigo-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  AI-FREELANCE-ESCROW
                </span>
              </div>
              <p className="text-slate-300 mb-4">
                AI-powered escrow system for freelancers and clients. Secure payments, automated milestones, and AI dispute resolution.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Github className="h-6 w-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Mail className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Team</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 AI-FREELANCE-ESCROW-AGENT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}