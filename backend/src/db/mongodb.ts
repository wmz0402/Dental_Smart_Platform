import mongoose from 'mongoose';
import dns from 'dns';

// 解决 Windows 环境下 DNS SRV 解析 MongoDB Atlas 域名 ECONNREFUSED 问题
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '114.114.114.114']);
} catch (e) {
  console.log('DNS 设置提示:', e);
}

export async function connectMongoDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://hungthaituoc_db_user:6fKtIcu1zUIarMKx@cluster0.xg055fu.mongodb.net/dental_smart?retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB Atlas 云数据库建立连接成功!');
  } catch (err) {
    console.error('MongoDB Atlas 云数据库连接提示 (如网络环境隔离，后端将继续运行在内置引擎模式):', err);
  }
}
