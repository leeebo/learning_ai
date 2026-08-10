const firstHalf = require("./course/en-01-07.cjs");
const secondHalf = require("./course/en-08-15.cjs");
const finalChapters = require("./course/en-16-17.cjs");
const { totalDays } = require("./courseMeta.cjs");
const course = [...firstHalf, ...secondHalf, ...finalChapters];

if (!Array.isArray(firstHalf) || !Array.isArray(secondHalf) || !Array.isArray(finalChapters) || course.length !== totalDays) {
  throw new Error(`The English course modules must contain exactly ${totalDays} chapters in total.`);
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The English course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
