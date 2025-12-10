import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Phone, Users, ArrowRight, Sparkles, Shield, Zap, Globe, Lock, Clock, HeartHandshake } from 'lucide-react'
import Lenis from 'lenis'

function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-black relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay"></div>
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] animate-pulse-soft"
        style={{
          transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] animate-pulse-soft"
        style={{
          transform: `translate(${-mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)`,
          animationDelay: '1s'
        }}
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/[0.05]">
        <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <span className="text-black font-bold text-lg">C</span>
            </div>
            <span className="text-lg font-bold text-white">Connexta</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost hidden sm:block text-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-white/60" />
            <span className="text-sm text-gray-400">Now available for teams</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-white">Team</span>
            <br />
            <span className="gradient-text">Communication</span>
            <br />
            <span className="text-white/40">Reimagined</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Connect your team with real-time messaging, voice calls, and seamless file sharing. 
            Built for modern teams who demand excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 group">
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">
              Sign In
            </Link>
          </div>
        </div>

        {/* App Preview */}
        <div 
          className="relative mt-16 animate-slide-up" 
          style={{ 
            animationDelay: '0.4s',
            transform: `perspective(1000px) rotateX(${mousePosition.y * 0.3}deg) rotateY(${mousePosition.x * 0.3}deg)`
          }}
        >
          <div className="glass rounded-3xl p-1.5 shadow-2xl shadow-white/[0.03]">
            <div className="bg-black/80 rounded-2xl overflow-hidden border border-white/[0.05]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <span className="ml-4 text-xs text-gray-500">Connexta</span>
              </div>
              
              <div className="flex h-[280px] md:h-[380px]">
                <div className="w-48 md:w-56 border-r border-white/[0.05] p-4 hidden sm:block">
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Channels</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.08] text-white text-sm">
                        <span className="text-gray-500">#</span>
                        <span>General</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 text-sm">
                        <span>#</span>
                        <span>Tech</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 text-sm">
                        <span>#</span>
                        <span>Marketing</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">#</span>
                      <span className="font-semibold text-white">General</span>
                    </div>
                    <button className="btn-primary px-4 py-2 text-xs">
                      Start Call
                    </button>
                  </div>
                  
                  <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">J</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">John Doe</span>
                          <span className="text-xs text-gray-600">10:42 AM</span>
                        </div>
                        <div className="message-bubble">
                          <p className="text-sm text-white/90">Hey team! Ready for the standup?</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">S</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">Sarah Kim</span>
                          <span className="text-xs text-gray-600">10:43 AM</span>
                        </div>
                        <div className="message-bubble">
                          <p className="text-sm text-white/90">Yes! Just finishing up 🚀</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Everything you need</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Powerful features to keep your team connected and productive.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-hover text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-7 h-7 text-white/70" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Real-Time Messaging</h3>
            <p className="text-gray-500">Instant messaging with rich formatting and file sharing.</p>
          </div>
          
          <div className="card-hover text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
              <Phone className="w-7 h-7 text-white/70" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Voice & Video Calls</h3>
            <p className="text-gray-500">Crystal clear audio and video with your team.</p>
          </div>
          
          <div className="card-hover text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
              <Users className="w-7 h-7 text-white/70" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Team Channels</h3>
            <p className="text-gray-500">Organize by department, project, or topic.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Why Connexta */}
      <section className="relative z-10 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Why teams choose Connexta</h2>
              <p className="text-gray-500 text-lg mb-8">
                Built from the ground up for modern teams who value simplicity, speed, and security.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Lightning Fast</h4>
                    <p className="text-gray-500 text-sm">Messages delivered in milliseconds, not seconds.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Enterprise Security</h4>
                    <p className="text-gray-500 text-sm">End-to-end encryption and compliance ready.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Work Anywhere</h4>
                    <p className="text-gray-500 text-sm">Access from any device, anywhere in the world.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="glass rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-white/[0.03] rounded-2xl">
                    <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                    <div className="text-gray-500 text-sm">Uptime SLA</div>
                  </div>
                  <div className="text-center p-6 bg-white/[0.03] rounded-2xl">
                    <div className="text-4xl font-bold text-white mb-2">&lt;50ms</div>
                    <div className="text-gray-500 text-sm">Message Latency</div>
                  </div>
                  <div className="text-center p-6 bg-white/[0.03] rounded-2xl">
                    <div className="text-4xl font-bold text-white mb-2">10K+</div>
                    <div className="text-gray-500 text-sm">Teams</div>
                  </div>
                  <div className="text-center p-6 bg-white/[0.03] rounded-2xl">
                    <div className="text-4xl font-bold text-white mb-2">24/7</div>
                    <div className="text-gray-500 text-sm">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Security */}
      <section className="relative z-10 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white/70" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Security first</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-12">
            Your data is encrypted at rest and in transit. We never sell your information.
          </p>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Lock className="w-5 h-5" />
              <span>End-to-End Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Testimonials */}
      <section className="relative z-10 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Loved by teams</h2>
            <p className="text-gray-500 text-lg">See what others are saying about Connexta.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <p className="text-gray-300 mb-6">"Connexta has transformed how our team communicates. It's fast, intuitive, and just works."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">A</div>
                <div>
                  <div className="text-white font-medium">Alex Chen</div>
                  <div className="text-gray-500 text-sm">CTO, TechCorp</div>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <p className="text-gray-300 mb-6">"We switched from Slack and never looked back. The simplicity is refreshing."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">M</div>
                <div>
                  <div className="text-white font-medium">Maria Garcia</div>
                  <div className="text-gray-500 text-sm">Product Lead, StartupXYZ</div>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <p className="text-gray-300 mb-6">"The best team communication tool we've ever used. Period."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">J</div>
                <div>
                  <div className="text-white font-medium">James Wilson</div>
                  <div className="text-gray-500 text-sm">CEO, DesignStudio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section className="relative z-10 py-24 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-6">
            <HeartHandshake className="w-8 h-8 text-white/70" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-500 text-lg mb-10">
            Join thousands of teams who have made the switch to Connexta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-10 py-4 flex items-center gap-2 group">
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-10 py-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with big CONNEXTA */}
      <footer className="relative z-10 border-t border-white/[0.05] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center">
            <h2 className="text-6xl sm:text-8xl md:text-9xl font-bold text-white/[0.03] tracking-tighter select-none">
              CONNEXTA
            </h2>
            <p className="text-gray-600 text-sm mt-8">© 2024 Connexta. Built for modern teams.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
