module.exports = {
  lang: "zh-CN",
  eleventyComputed: {
    course: data => data.courseZh,
    day: data => data.dayNumber ? data.courseZh[data.dayNumber - 1] : undefined,
  },
};
