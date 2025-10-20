import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  machine: { type: String },
  bay_2: { type: String },
  activeList: { type: String },
  activeInLine: { type: String },
  // 'sequenz' must be a number
  sequenz: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'productionSchedule'
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
