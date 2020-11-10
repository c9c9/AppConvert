var styles = {
  'none': '\x1B[0m', //重置
  'italic': '\x1B[3m', // 斜体
  'underline': '\x1B[4m', // 下划线
  'bold': '\x1B[1m', // 粗体
  'reverse': '\x1B[7m', // 反向
  'hidden': '\x1B[8m', // 隐藏
  'strikethrough': '\x1B[9m',//删除线


  'bright': '\x1B[1m', // 亮色
  'grey': '\x1B[2m', // 灰色
  'black': '\x1B[30m', // 黑色
  'red': '\x1B[31m', // 红色
  'green': '\x1B[32m', // 绿色
  'yellow': '\x1B[33m', // 黄色
  'blue': '\x1B[34m', // 蓝色
  'magenta': '\x1B[35m', // 品红
  'cyan': '\x1B[36m', // 青色
  'white': '\x1B[37m', // 白色
  'blackBG': '\x1B[40m', // 背景色为黑色
  'redBG': '\x1B[41m', // 背景色为红色
  'greenBG': '\x1B[42m', // 背景色为绿色
  'yellowBG': '\x1B[43m', // 背景色为黄色
  'blueBG': '\x1B[44m', // 背景色为蓝色
  'magentaBG': '\x1B[45m', // 背景色为品红
  'cyanBG': '\x1B[46m', // 背景色为青色
  'whiteBG': '\x1B[47m',// 背景色为白色
}

function style(keys, ...options) {
  const values = [];
  let content = options.pop();
  keys = (typeof keys === 'string' ? [keys] : keys).concat(options);
  keys.forEach(key => {
    values.push(key.indexOf('\x1B') > -1 ? key : styles[key])
  });
  let style = values.join('') || values.map((style, index) => {
    const length = values.length - 1;
    return length === 0 ? style : style.replace(index === 0 ? 'm' : index === length ? '\x1B[' : /\x1B\[|m/g, '');
  }).join(';');
  return style + content + styles['none']
}

Object.assign(style, styles);
module.exports = style