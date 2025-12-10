import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const connectedUsers = new Map();

export const initializeSocketManager = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    connectedUsers.set(socket.user._id.toString(), socket.id);

    socket.on('join:channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave:channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('join:dm', (dmRoomId) => {
      socket.join(`dm:${dmRoomId}`);
    });

    socket.on('leave:dm', (dmRoomId) => {
      socket.leave(`dm:${dmRoomId}`);
    });

    socket.on('call:join', (data) => {
      const { roomId, roomType } = data;
      const room = roomType === 'channel' ? `call:channel:${roomId}` : `call:dm:${roomId}`;
      socket.join(room);
      socket.to(room).emit('call:user-joined', {
        userId: socket.user._id,
        userName: socket.user.name,
        avatarUrl: socket.user.avatarUrl
      });
    });

    socket.on('call:leave', (data) => {
      const { roomId, roomType } = data;
      const room = roomType === 'channel' ? `call:channel:${roomId}` : `call:dm:${roomId}`;
      socket.to(room).emit('call:user-left', {
        userId: socket.user._id
      });
      socket.leave(room);
    });

    socket.on('call:signal', (data) => {
      const { roomId, roomType, signalData, targetUserId } = data;
      const room = roomType === 'channel' ? `call:channel:${roomId}` : `call:dm:${roomId}`;
      
      if (targetUserId) {
        const targetSocketId = connectedUsers.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('call:signal', {
            signalData,
            fromUserId: socket.user._id.toString(),
            fromUserName: socket.user.name
          });
        }
      } else {
        socket.to(room).emit('call:signal', {
          signalData,
          fromUserId: socket.user._id.toString(),
          fromUserName: socket.user.name
        });
      }
    });

    socket.on('call:toggle-mute', (data) => {
      const { roomId, roomType, isMuted } = data;
      const room = roomType === 'channel' ? `call:channel:${roomId}` : `call:dm:${roomId}`;
      socket.to(room).emit('call:user-muted', {
        userId: socket.user._id,
        isMuted
      });
    });

    socket.on('typing:start', (data) => {
      const { channelId, isDm, dmRoomId } = data;
      const room = isDm ? `dm:${dmRoomId}` : `channel:${channelId}`;
      socket.to(room).emit('typing:start', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    socket.on('typing:stop', (data) => {
      const { channelId, isDm, dmRoomId } = data;
      const room = isDm ? `dm:${dmRoomId}` : `channel:${channelId}`;
      socket.to(room).emit('typing:stop', {
        userId: socket.user._id
      });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.user._id.toString());
    });
  });
};

export const emitToChannel = (io, channelId, event, data) => {
  io.to(`channel:${channelId}`).emit(event, data);
};

export const emitToDM = (io, dmRoomId, event, data) => {
  io.to(`dm:${dmRoomId}`).emit(event, data);
};

export const emitToCall = (io, roomId, roomType, event, data) => {
  const room = roomType === 'channel' ? `call:channel:${roomId}` : `call:dm:${roomId}`;
  io.to(room).emit(event, data);
};
