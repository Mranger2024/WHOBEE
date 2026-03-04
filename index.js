import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
      cors: {
          origin: '*',
          methods: ['GET', 'POST']
      }
  });

  io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);
    socket.on("join-room", (data) => {
      console.log("join-room", data, socket.id);
      const { email, room } = data;
      io.to(room).emit("user-joined", { email, id: socket.id });
      socket.join(room);
      io.to(socket.id).emit("join-room", data);
    });
  
    socket.on("start-call", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });
  
    socket.on("answer", ({ to, ans }) => {
      io.to(to).emit("answer", { from: socket.id, ans });
    });
  
    socket.on("peer-nego-needed", ({ to, offer }) => {
      //console.log("peer-nego-needed", offer);
      io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
    });
  
    socket.on("peer-nego-done", ({ to, ans }) => {
      //console.log("peer-nego-done", ans);
      io.to(to).emit("peer-nego-final", { from: socket.id, ans });
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});