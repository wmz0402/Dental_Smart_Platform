import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { initDatabase } from './db/database';
import { connectMongoDB } from './db/mongodb';
import { router } from './routes/routes';
import { authRouter } from './routes/auth';
import { DeviceSimulator } from './services/simulator';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
// 提升 JSON 与表单解析体积上限至 50mb，防止 Base64 图片上传报 413 Payload Too Large 错误
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 注册 API 路由
app.use('/api/auth', authRouter);
app.use('/api', router);

const server = http.createServer(app);

// 初始化 WebSocket 服务
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('前端客户端已建立 WebSocket 实时遥测连接');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: '已成功接入智能感控平台实时数据流' }));
});

// 初始化数据库引擎
initDatabase()
  .then(() => {
    connectMongoDB(); // 尝试连接 MongoDB

    // 启动模拟器
    const simulator = new DeviceSimulator(wss);
    simulator.start();

    server.listen(port, () => {
      console.log(`=======================================================`);
      console.log(` 智护牙境 - 口腔智能感控平台后端服务已成功启动`);
      console.log(` RESTful API 监听地址: http://localhost:${port}/api`);
      console.log(` 邮箱验证与登录 API: http://localhost:${port}/api/auth`);
      console.log(` WebSocket 广播监听端口: ws://localhost:${port}`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('服务器启动失败:', err);
  });
