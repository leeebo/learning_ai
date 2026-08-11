const course = require("./course/en-15.cjs");
const { totalDays } = require("./courseMeta.cjs");

if (!Array.isArray(course) || course.length !== totalDays) {
  throw new Error(`The English course plan must contain exactly ${totalDays} chapters in total.`);
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The English course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
