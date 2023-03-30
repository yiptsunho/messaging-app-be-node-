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

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("send_message", (data) => {
        console.log(data)
        socket.to(data.room).emit("receive_message", data);
        // socket.broadcast.emit("receive_message", data)
    });

    socket.on("join_room", (data) => {
        console.log(data)
        socket.join(data)
    });
});

server.listen(8081, () => {
    console.log("SERVER IS RUNNING!!");
});