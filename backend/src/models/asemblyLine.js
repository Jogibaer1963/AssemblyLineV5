import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  // Use string UUIDs for document IDs
  _id: { type: String },
  machine: { type: String },
  bay_2: { type: String },
  activeList: { type: String },
  activeInLine: { type: String },
  activeBayFCB_1: { type: String },
  activeBayFCB_2: { type: String },
  activeBay_2: { type: String },
  activeBay_3: { type: String },
  activeBay_4: { type: String },
  activeBay_5: { type: String },
  activeBay_6: { type: String },
  activeBay_7: { type: String },
  activeBay_8: { type: String },
  activeBay_9: { type: String },
  activeBay_10: { type: String },
  fcb_1_start: { type: Date },
  fcb_1_end: { type: Date },
  fcb_2_start: { type: Date },
  fcb_2_end: { type: Date },
  bay_2_start: { type: Date },
  bay_2_end: { type: Date },
  bay_3_start: { type: Date },
  bay_3_end: { type: Date },
  bay_4_start: { type: Date },
  bay_4_end: { type: Date },
  bay_5_start: { type: Date },
  bay_5_end: { type: Date },
  bay_6_start: { type: Date },
  bay_6_end: { type: Date },
  bay_7_start: { type: Date },
  bay_7_end: { type: Date },
  bay_8_start: { type: Date },
  bay_8_end: { type: Date },
  bay_9_start: { type: Date },
  bay_9_end: { type: Date },
  bay_10_start: { type: Date },
  bay_10_end: { type: Date },
  // 'sequenz' must be a number
  sequenz: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'productionSchedule'
});

//const Schedule = mongoose.model('Schedule', scheduleSchema);
export default mongoose.models.Schedule
|| mongoose.model("Schedule", scheduleSchema);

// export default Schedule;
