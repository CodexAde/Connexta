import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import * as callService from '../services/callService'

const CallContext = createContext(null)

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}

export const CallProvider = ({ children }) => {
  const { user, socket } = useAuth()
  const [currentCall, setCurrentCall] = useState(null)
  const [participants, setParticipants] = useState([])
  const [localStream, setLocalStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [ongoingCalls, setOngoingCalls] = useState({}) // Track ongoing calls in channels
  
  const peerConnections = useRef({})
  const remoteStreams = useRef({})
  const localStreamRef = useRef(null)
  const currentCallRef = useRef(null)

  // Keep refs in sync with state
  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  useEffect(() => {
    currentCallRef.current = currentCall
  }, [currentCall])

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    if (!socket) return

    const handleCallStarted = (call) => {
      // Track ongoing call for this channel/dm
      const roomKey = call.channel || call.dmRoomId
      setOngoingCalls(prev => ({ ...prev, [roomKey]: call }))
      
      if (call.startedBy._id !== user?._id) {
        setIncomingCall(call)
      }
    }

    const handleUserJoined = async (data) => {
      console.log('User joined:', data)
      if (currentCallRef.current && data.user._id !== user?._id) {
        // Add user to participants if not already there
        setParticipants(prev => {
          if (prev.find(p => p._id === data.user._id)) return prev
          return [...prev, { ...data.user, isMuted: false }]
        })
        
        // Create peer connection as initiator (we were here first)
        setTimeout(async () => {
          await createPeerConnection(data.user._id, true)
        }, 500)
      }
    }

    const handleUserLeft = (data) => {
      setParticipants(prev => prev.filter(p => p._id !== data.userId))
      if (peerConnections.current[data.userId]) {
        peerConnections.current[data.userId].close()
        delete peerConnections.current[data.userId]
      }
      if (remoteStreams.current[data.userId]) {
        delete remoteStreams.current[data.userId]
      }
    }

    const handleSignal = async (data) => {
      const { signalData, fromUserId } = data
      console.log('Received signal from:', fromUserId, signalData.type || 'ICE')
      
      try {
        if (!peerConnections.current[fromUserId]) {
          await createPeerConnection(fromUserId, false)
        }
        
        const pc = peerConnections.current[fromUserId]
        if (!pc) return
        
        if (signalData.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          
          const call = currentCallRef.current
          socket.emit('call:signal', {
            roomId: call?.channel || call?.dmRoomId,
            roomType: call?.type,
            signalData: answer,
            targetUserId: fromUserId
          })
        } else if (signalData.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData))
        } else if (signalData.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signalData))
          } catch (e) {
            console.log('ICE candidate error (may be normal):', e)
          }
        }
      } catch (error) {
        console.error('Signal handling error:', error)
      }
    }

    const handleUserMuted = (data) => {
      setParticipants(prev => 
        prev.map(p => p._id === data.userId ? { ...p, isMuted: data.isMuted } : p)
      )
    }

    const handleCallEnded = (data) => {
      const roomKey = data?.roomId
      if (roomKey) {
        setOngoingCalls(prev => {
          const updated = { ...prev }
          delete updated[roomKey]
          return updated
        })
      }
      cleanup()
    }

    socket.on('call:started', handleCallStarted)
    socket.on('call:user-joined', handleUserJoined)
    socket.on('call:user-left', handleUserLeft)
    socket.on('call:signal', handleSignal)
    socket.on('call:user-muted', handleUserMuted)
    socket.on('call:ended', handleCallEnded)

    return () => {
      socket.off('call:started', handleCallStarted)
      socket.off('call:user-joined', handleUserJoined)
      socket.off('call:user-left', handleUserLeft)
      socket.off('call:signal', handleSignal)
      socket.off('call:user-muted', handleUserMuted)
      socket.off('call:ended', handleCallEnded)
    }
  }, [socket, user?._id])

  const createPeerConnection = async (userId, initiator) => {
    console.log('Creating peer connection for:', userId, 'initiator:', initiator)
    
    // Close existing connection if any
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close()
    }
    
    const pc = new RTCPeerConnection(iceServers)
    peerConnections.current[userId] = pc

    // Add local tracks
    const stream = localStreamRef.current
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind)
        pc.addTrack(track, stream)
      })
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind)
      remoteStreams.current[userId] = event.streams[0]
      setParticipants(prev => 
        prev.map(p => p._id === userId ? { ...p, stream: event.streams[0] } : p)
      )
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const call = currentCallRef.current
        socket.emit('call:signal', {
          roomId: call?.channel || call?.dmRoomId,
          roomType: call?.type,
          signalData: event.candidate,
          targetUserId: userId
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('ICE state:', pc.iceConnectionState)
    }

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState)
    }

    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        })
        await pc.setLocalDescription(offer)
        
        const call = currentCallRef.current
        socket.emit('call:signal', {
          roomId: call?.channel || call?.dmRoomId,
          roomType: call?.type,
          signalData: offer,
          targetUserId: userId
        })
      } catch (error) {
        console.error('Error creating offer:', error)
      }
    }

    return pc
  }

  const startCall = async (type, channelId, recipientId, withVideo = false) => {
    try {
      // Request media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withVideo 
      })
      setLocalStream(stream)
      localStreamRef.current = stream
      setIsVideoEnabled(withVideo)

      const data = await callService.createCall({ type, channelId, recipientId })
      setCurrentCall(data.call)
      currentCallRef.current = data.call
      setParticipants([{ ...user, isMuted: false }])
      setInCall(true)

      if (socket) {
        socket.emit('call:join', {
          roomId: channelId || recipientId,
          roomType: type
        })
      }

      return data.call
    } catch (error) {
      console.error('Failed to start call:', error)
      // Try audio-only if video fails
      if (withVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          setLocalStream(audioStream)
          localStreamRef.current = audioStream
          setIsVideoEnabled(false)
          
          const data = await callService.createCall({ type, channelId, recipientId })
          setCurrentCall(data.call)
          currentCallRef.current = data.call
          setParticipants([{ ...user, isMuted: false }])
          setInCall(true)

          if (socket) {
            socket.emit('call:join', {
              roomId: channelId || recipientId,
              roomType: type
            })
          }

          return data.call
        } catch (audioError) {
          console.error('Failed to start audio call:', audioError)
          throw audioError
        }
      }
      throw error
    }
  }

  const joinCall = async (call) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .catch(() => navigator.mediaDevices.getUserMedia({ audio: true, video: false }))
      
      setLocalStream(stream)
      localStreamRef.current = stream
      setIsVideoEnabled(stream.getVideoTracks().length > 0)

      await callService.joinCall(call._id)
      setCurrentCall(call)
      currentCallRef.current = call
      setParticipants(call.participants?.map(p => ({ ...p, isMuted: false })) || [])
      setInCall(true)
      setIncomingCall(null)

      if (socket) {
        socket.emit('call:join', {
          roomId: call.channel || call.dmRoomId,
          roomType: call.type
        })
      }
    } catch (error) {
      console.error('Failed to join call:', error)
      throw error
    }
  }

  const leaveCall = async () => {
    if (currentCall) {
      try {
        await callService.leaveCall(currentCall._id)
        if (socket) {
          socket.emit('call:leave', {
            roomId: currentCall.channel || currentCall.dmRoomId,
            roomType: currentCall.type
          })
        }
      } catch (error) {
        console.error('Failed to leave call:', error)
      }
    }
    cleanup()
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        
        if (socket && currentCall) {
          socket.emit('call:toggle-mute', {
            roomId: currentCall.channel || currentCall.dmRoomId,
            roomType: currentCall.type,
            isMuted: !audioTrack.enabled
          })
        }
      }
    }
  }

  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled
        setIsVideoEnabled(videoTracks[0].enabled)
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
          const videoTrack = videoStream.getVideoTracks()[0]
          localStream.addTrack(videoTrack)
          setIsVideoEnabled(true)
          
          // Add video track to all peer connections
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video')
            if (sender) {
              sender.replaceTrack(videoTrack)
            } else {
              pc.addTrack(videoTrack, localStream)
            }
          })
        } catch (error) {
          console.error('Failed to enable video:', error)
        }
      }
    }
  }

  const declineCall = () => {
    setIncomingCall(null)
  }

  const getOngoingCall = (roomId) => {
    return ongoingCalls[roomId] || null
  }

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
    remoteStreams.current = {}
    
    setLocalStream(null)
    localStreamRef.current = null
    setCurrentCall(null)
    currentCallRef.current = null
    setParticipants([])
    setInCall(false)
    setIsMuted(false)
    setIsVideoEnabled(false)
  }, [])

  const value = {
    currentCall,
    participants,
    localStream,
    isMuted,
    isVideoEnabled,
    inCall,
    incomingCall,
    ongoingCalls,
    remoteStreams: remoteStreams.current,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    declineCall,
    getOngoingCall
  }

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}
