const express = require("express");
const app = express(); // app is an instance of express
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

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
    console.log(`User connected: ${socket.id}`);
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            socketId: id,
            socket: socket,
            userId: socket.userId,
            loginId: socket.loginId,
        });
    }
    console.log(users)

    socket.on("send_message", (data) => {
        console.log(data)
        socket.to(data.room).emit("receive_message", data);
        // save message in database
    });

    socket.on("join_room", (data) => {
        // data = {
        //     roomId: "",
        //     receiverId: ""
        // }
        console.log("someone joined room " + data.roomId)
        console.log(users)
        let userIndex = users.findIndex(user => user.userId == data.receiverId);
        let targetSocket = users[userIndex].socket;
        console.log("user " + data.receiverId + " is invited to join room " + data.roomId)
        targetSocket.join(data.roomId)
    });
});

server.listen(8081, () => {
    console.log("SERVER IS RUNNING!!");
});