const fs = require('fs');
const readline = require('readline');

/**
 *
 * @param tips
 * @param size
 * @param charset
 * @returns {string}
 */
function readInputSync(tips = '', size = 10000, charset = 'utf8') {
  process.stdout.write(tips);
  process.stdin.pause();
  const buf = Buffer.allocUnsafe(size);
  fs.readSync(process.stdin.fd, buf, 0, size, 0);
  process.stdin.end();
  return buf.toString(charset, 0, size);
}

/**
 *
 * @param tips
 * @param charset
 * @returns {Promise<string>}
 */
function readInput(tips = '', charset = 'utf8') {
  process.stdout.write(tips);
  process.stdin.setEncoding(charset);
  return new Promise((resolve, reject) => {
    process.stdin.once('readable', () => {
      try {
        resolve(process.stdin.read() || '')
      } catch (e) {
        reject('')
      }
    })
  })
}

/**
 *
 * @param tips
 * @returns {Promise<string>}
 */
function readInputLine(tips = '') {
  return new Promise((resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(tips, (content) => {
      rl.close();
      resolve(content || '');
    });
  }))
}

module.exports = {
  readInput,
  readInputSync,
  readInputLine
}
