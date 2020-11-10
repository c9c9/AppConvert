const fs = require("fs"), stream = require('stream'), PATH = require('path');
const File = {
  /**
   *
   * @param path
   * @param [isLink]
   * @returns {{state: boolean, error: *}|{result: Stats, state: boolean}}
   */
  statSync: function (path, isLink) {
    try {
      return {state: true, result: isLink ? fs.statSync(path) : fs.lstatSync(path)}
    } catch (e) {
      return {state: false, error: e}
    }
  },
  copyFile: function (src, target, mode = 0) {
    mode = typeof mode === "function" ? 0 : mode;
    return new Promise(((resolve) => {
      fs.copyFile(src, target, mode, function (err) {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    }))
  },
  copyFileSync: function (src, target, mode = 0) {
    mode = typeof mode === "function" ? 0 : mode;
    try {
      return {state: true, result: fs.copyFileSync(src, target, mode)}
    } catch (e) {
      return {state: false, error: e}
    }
  },
  copyFileStream: function (src, target) {
    return new Promise(((resolve) => {
      let stream = fs.createReadStream(src).pipe(fs.createWriteStream(target));
      stream.once('error', (e) => {
        resolve({error: e, state: false})
      })
      stream.once("close", (e) => {
        resolve({error: e, state: true})
      });
    }))
  },
  writeFileData(targetPath, data) {
    return new Promise(((resolve) => {
      let bufferStream = new stream.PassThrough();
      bufferStream.end(Buffer.from(data));
      let ws = bufferStream.pipe(fs.createWriteStream(targetPath));
      ws.once('error', (e) => {
        resolve({error: e, state: false})
      });
      ws.once('close', close = (e) => {
        resolve({error: e, state: true})
      });
    }))
  },
  removeFile: function (filePath) {
    return new Promise(((resolve) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    }))
  },
  removeDir: function (path, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.rmdir(path, options, (err) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    })
  },
  makeDir: function (path, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.mkdir(path, options, err => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    })
  },
  mkdirSync: function (path, options) {
    try {
      return {result: fs.mkdirSync(path, options), state: true}
    } catch (e) {
      return {error: e, state: false}
    }
  },
  makeDirSync: function makeDirSync(path, options, Path = PATH) {
    if (fs.existsSync(path)) {
      return {state: true}
    }
    let preDir = Path.dirname(path);
    if (!fs.existsSync(preDir)) {
      let {state, error} = makeDirSync(preDir, options, Path);
      if (state) {
        return File.mkdirSync(path, options)
      } else {
        return {state, error}
      }
    }
    return File.mkdirSync(path, options)
  },
  writeFile: function (file, content, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.writeFile(file, content, options, (err) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    })
  },
  writeFileSync: function (file, content, options) {
    options = typeof options === "function" ? undefined : options;
    try {
      return {state: true, result: fs.writeFileSync(file, content, options)}
    } catch (e) {
      return {error: e, state: false}
    }
  },
  readFile: function (file, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.readFile(file, options, (err, files) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: files, state: true})
        }
      })
    })
  },
  readFileSync: function (file, options) {
    options = typeof options === "function" ? undefined : options;
    try {
      return {state: true, result: fs.readFileSync(file, options)}
    } catch (e) {
      return {error: e, state: false}
    }
  },
  appendFile: function (file, content, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.appendFile(file, content, options, (err) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({error: err, state: true})
        }
      })
    })
  },
  readdir: function (file, content, options) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.readdir(file, options, (err, files) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: files, state: true})
        }
      })
    })
  },
  /**
   *
   * @param path
   * @param [options]
   * @returns {{state: boolean, error: *}|{result: string[], state: boolean}}
   */
  readdirSync: function (path, options) {
    try {
      return {result: fs.readdirSync(path, options), state: true}
    } catch (e) {
      return {state: true, error: e}
    }
  },
  /**
   *
   * @param path
   * @param options
   * @returns {Promise<{state:boolean,error:*,result:Stats}>}
   */
  stat: function (path, options = {bigint: false}) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.stat(path, options, (err, stats) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: stats, state: true})
        }
      })
    })
  },
  /**
   *
   * @param path
   * @param options
   * @returns {Promise<{state:boolean,error:*,result:Stats}>}
   */
  lstat: function (path, options = {bigint: false}) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.lstat(path, options, (err, stats) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: stats, state: true})
        }
      })
    })
  },
  fstat: function (path, options = {bigint: false}) {
    options = typeof options === "function" ? undefined : options;
    return new Promise((resolve) => {
      fs.fstat(path, options, (err, stats) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: stats, state: true})
        }
      })
    })
  },
  symlink(target, path, type) {
    type = typeof type === "function" ? undefined : type;
    return new Promise((resolve) => {
      fs.symlink(path, type, (err, res) => {
        if (err) {
          resolve({error: err, state: false})
        } else {
          resolve({result: res, state: true})
        }
      })
    })
  },
  toUrlPath: function toUrlPath(path) {
    return (path || '').replace(/[\/\\]+/, '/');
  },
};
module.exports = File