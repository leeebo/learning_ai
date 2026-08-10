const course = require("./course/zh-CN.json");

if (!Array.isArray(course) || course.length !== 15) {
  throw new Error("The Chinese course must contain exactly 15 chapters.");
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The Chinese course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
