const firstHalf = require("./course/en-01-07.cjs");
const secondHalf = require("./course/en-08-15.cjs");
const course = [...firstHalf, ...secondHalf];

if (!Array.isArray(firstHalf) || !Array.isArray(secondHalf) || course.length !== 15) {
  throw new Error("The English course modules must contain exactly 15 chapters in total.");
}

course.forEach((day, index) => {
  if (day.n !== index + 1) {
    throw new Error(`The English course is missing contiguous Day ${index + 1}.`);
  }
});

module.exports = course;
