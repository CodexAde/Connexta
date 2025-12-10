import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold gradient-text">Connexta</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="btn-ghost">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-gray-400">Now available for teams</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Team Communication</span>
            <br />
            <span className="text-white">Reimagined</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Connect your team with real-time messaging, voice calls, and seamless file sharing. 
            Built for modern teams who demand excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
              Start for Free
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
              Sign In to Your Account
            </Link>
          </div>
        </div>

        <div className="relative mt-20">
          <div className="glass rounded-3xl p-2 shadow-2xl shadow-indigo-500/10">
            <div className="bg-bg-secondary rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              
              <div className="flex h-96">
                <div className="w-64 border-r border-white/5 p-4">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Channels</h3>
                    <div className="space-y-1">
                      <div className="channel-item-active">
                        <span className="text-gray-500">#</span>
                        <span>General</span>
                      </div>
                      <div className="channel-item">
                        <span className="text-gray-500">#</span>
                        <span>Tech</span>
                      </div>
                      <div className="channel-item">
                        <span className="text-gray-500">#</span>
                        <span>Marketing</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Direct Messages</h3>
                    <div className="space-y-1">
                      <div className="channel-item">
                        <div className="avatar-sm">A</div>
                        <span>Alex Chen</span>
                      </div>
                      <div className="channel-item">
                        <div className="avatar-sm">S</div>
                        <span>Sarah Kim</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">#</span>
                      <span className="font-semibold">General</span>
                      <span className="text-sm text-gray-500">• 24 members</span>
                    </div>
                    <button className="btn-accent px-4 py-2 text-sm">
                      Start Call
                    </button>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="flex gap-3 animate-fade-in">
                      <div className="avatar-sm bg-indigo-500/20 text-indigo-400">J</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">John Doe</span>
                          <span className="text-xs text-gray-500">10:42 AM</span>
                        </div>
                        <div className="message-bubble">
                          <p className="text-sm">Hey team! Ready for the standup?</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 animate-fade-in">
                      <div className="avatar-sm bg-purple-500/20 text-purple-400">S</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Sarah Kim</span>
                          <span className="text-xs text-gray-500">10:43 AM</span>
                        </div>
                        <div className="message-bubble">
                          <p className="text-sm">Yes! Just finishing up some code review 🚀</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-white/5">
                    <div className="input-field flex items-center gap-3">
                      <span className="text-gray-500">Message #General</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card-hover text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Messaging</h3>
            <p className="text-gray-400">Instant messaging with rich formatting, file sharing, and reactions.</p>
          </div>
          
          <div className="card-hover text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice & Video Calls</h3>
            <p className="text-gray-400">Crystal clear audio and video calls with your team members.</p>
          </div>
          
          <div className="card-hover text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Channels</h3>
            <p className="text-gray-400">Organize conversations by department, project, or topic.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-500">
          <p>© 2024 Connexta. Built for modern teams.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
