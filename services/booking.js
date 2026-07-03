function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function generateSlots(doctor, bookedTimes) {
  const slots = [];
  const start = toMinutes(doctor.work_start);
  const end = toMinutes(doctor.work_end);
  let cur = start;
  while (cur + doctor.slot_minutes <= end) {
    const time = toHHMM(cur);
    if (!bookedTimes.includes(time)) {
      slots.push(time);
    }
    cur += doctor.slot_minutes;
  }
  return slots;
}

module.exports = { generateSlots, toMinutes, toHHMM };
