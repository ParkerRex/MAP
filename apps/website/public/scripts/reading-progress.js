window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  const winHeight = window.innerHeight || document.documentElement.clientHeight;
  const docHeight =
    document.body.scrollHeight || document.documentElement.scrollHeight;
  const scrollPercent = (scrollY / (docHeight - winHeight)) * 100;
  document.querySelector('#readingProgress').style.width = `${scrollPercent}%`;
});
