import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  id: number;
  sn: string;
  name: string;
  type: 'WATER' | 'AIR';
  clinic_id: number;
  location: string;
  work_mode: 'NORMAL' | 'ECO' | 'DEEP_CLEAN' | 'OFF';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  uv_status: number;
  filter_level: number;
  uv_lamp_health: number;
}

const DeviceSchema = new Schema<IDevice>({
  id: { type: Number, required: true, unique: true },
  sn: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['WATER', 'AIR'], required: true },
  clinic_id: { type: Number, default: 101 },
  location: { type: String, default: '诊室' },
  work_mode: { type: String, default: 'NORMAL' },
  status: { type: String, default: 'ONLINE' },
  uv_status: { type: Number, default: 1 },
  filter_level: { type: Number, default: 100 },
  uv_lamp_health: { type: Number, default: 100 }
}, { timestamps: true });

export interface IAlarm extends Document {
  id: number;
  device_sn: string;
  device_name: string;
  level: 'CRITICAL' | 'WARNING';
  title: string;
  description: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  triggered_at: string;
}

const AlarmSchema = new Schema<IAlarm>({
  id: { type: Number, required: true, unique: true },
  device_sn: { type: String, required: true },
  device_name: { type: String, required: true },
  level: { type: String, default: 'WARNING' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'UNRESOLVED' },
  triggered_at: { type: String, required: true }
}, { timestamps: true });

export interface IConsumable extends Document {
  id: number;
  device_sn: string;
  item_name: string;
  life_remaining: number;
  estimated_replace_date: string;
}

const ConsumableSchema = new Schema<IConsumable>({
  id: { type: Number, required: true, unique: true },
  device_sn: { type: String, required: true },
  item_name: { type: String, required: true },
  life_remaining: { type: Number, required: true },
  estimated_replace_date: { type: String, required: true }
}, { timestamps: true });

export const DeviceModel: any = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
export const AlarmModel: any = mongoose.models.Alarm || mongoose.model<IAlarm>('Alarm', AlarmSchema);
export const ConsumableModel: any = mongoose.models.Consumable || mongoose.model<IConsumable>('Consumable', ConsumableSchema);
