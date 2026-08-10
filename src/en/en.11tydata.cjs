module.exports = {
  lang: "en",
  eleventyComputed: {
    course: data => data.courseEn,
    day: data => data.dayNumber ? data.courseEn[data.dayNumber - 1] : undefined,
  },
};
