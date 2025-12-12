import { io } from "socket.io-client";

export const socket = io("http://220.93.220.93:3001", {
  withCredentials: true,
});
