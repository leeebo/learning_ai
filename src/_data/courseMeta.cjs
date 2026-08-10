const totalDays = 17;

module.exports = Object.freeze({
  totalDays,
  chapterNumbers: Object.freeze(Array.from({ length: totalDays }, (_, index) => index + 1)),
  verifiedOn: "2026-08-11",
});
