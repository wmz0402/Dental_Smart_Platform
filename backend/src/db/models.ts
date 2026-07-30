import mongoose, { Schema, Document } from 'mongoose';

// 1. 设备模型
export interface IDevice extends Document {
  sn: string;
  name: string;
  type: string;
  clinicId: number;
  location: string;
  workMode: string;
  status: string;
  uvStatus: number;
  filterLevel: number;
  uvLampHealth: number;
  createdAt: Date;
}

const DeviceSchema: Schema = new Schema({
  sn: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  clinicId: { type: Number, default: 1 },
  location: { type: String, default: '诊所科室' },
  workMode: { type: String, default: 'NORMAL' },
  status: { type: String, default: 'ONLINE' },
  uvStatus: { type: Number, default: 1 },
  filterLevel: { type: Number, default: 100 },
  uvLampHealth: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
});

export const MongoDevice = mongoose.model<IDevice>('Device', DeviceSchema);

// 2. 遥测日志模型
export interface ITelemetryLog extends Document {
  deviceSn: string;
  tdsVal: number;
  turbidity: number;
  flowRate: number;
  pressure: number;
  dewPoint: number;
  pm25: number;
  uvIntensity: number;
  recordedAt: Date;
}

const TelemetryLogSchema: Schema = new Schema({
  deviceSn: { type: String, required: true },
  tdsVal: { type: Number },
  turbidity: { type: Number },
  flowRate: { type: Number },
  pressure: { type: Number },
  dewPoint: { type: Number },
  pm25: { type: Number },
  uvIntensity: { type: Number },
  recordedAt: { type: Date, default: Date.now }
});

export const MongoTelemetry = mongoose.model<ITelemetryLog>('TelemetryLog', TelemetryLogSchema);
