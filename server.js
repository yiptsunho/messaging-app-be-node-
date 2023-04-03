const express = require("express");
const app = express(); // app is an instance of express
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // TODO: set origin to FE hosting site only
        // origin: "http://localhost:3001",
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const joinRoom = ({ targetSocket, data }) => {
    if (targetSocket) {
        targetSocket.join(data.roomId)
    } else {
        console.log(`User ${data.receiverId} not found`)
    }
}

io.use((socket, next) => {

    const userId = socket.handshake.auth.userId;
    const loginId = socket.handshake.auth.loginId;
    if (!userId || !loginId) {
        return next(new Error("invalid userId or loginId"));
    }
    socket.userId = userId;
    socket.loginId = loginId;
    next();
});

io.on("connection", (socket) => {
    console.log(`User connected: User ${socket.loginId} (${socket.userId})`);

    socket.on("send_message", (data) => {
        console.log(data)
        socket.to(data.room).emit("receive_message", data);
        // TODO: save message in services
    });

    socket.on("join_room", async (data) => {
        console.log("someone joined room " + data.roomId)
        const sockets = await io.fetchSockets()
        if (data.isGroup) {
            for (let receiverId of data.receiverId) {
                let socketIndex = sockets.findIndex(socket => socket.userId == receiverId);
                let targetSocket = sockets[socketIndex];
                const groupData = {
                    roomId: data.roomId,
                    receiverId: receiverId,
                    isGroup: data.isGroup
                }
                console.log("user " + receiverId + " is invited to join room " + data.roomId)
                joinRoom({targetSocket: targetSocket, data: groupData})
            }
        } else {
            let socketIndex = sockets.findIndex(socket => socket.userId == data.receiverId);
            let targetSocket = sockets[socketIndex];
            console.log("user " + data.receiverId + " is invited to join room " + data.roomId)
            joinRoom({targetSocket: targetSocket, data: data})
            // if (targetSocket) {
            //     targetSocket.join(data.roomId)
            // } else {
            //     console.log(`User ${data.receiverId} not found`)
            // }
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(reason)
    });
});

server.listen(8081, '192.168.102.184', () => {
    console.log("SERVER IS RUNNING!!");
});