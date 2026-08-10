const firstFifteen = require("./course/zh-CN.json");
const finalChapters = require("./course/zh-16-17.cjs");
const { totalDays } = require("./courseMeta.cjs");
const course = [...firstFifteen, ...finalChapters];

if (!Array.isArray(firstFifteen) || !Array.isArray(finalChapters) || course.length !== totalDays) {
  throw new Error(`The Chinese course modules must contain exactly ${totalDays} chapters in total.`);
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The Chinese course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
