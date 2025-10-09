import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  machineNumber: String,
  st_1: { type: String, required: true },
  st_2: { type: String, required: true },
  st_3: { type: String, required: true },
  st_4: { type: String, required: true },
  engine_merge: { type: String, required: true }
}, { timestamps: true,
            collection: 'productionSchedule'});

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
