const course = require("./course/zh-15.cjs");
const { totalDays } = require("./courseMeta.cjs");

if (!Array.isArray(course) || course.length !== totalDays) {
  throw new Error(`The Chinese course plan must contain exactly ${totalDays} chapters in total.`);
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The Chinese course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
