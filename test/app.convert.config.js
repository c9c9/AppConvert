const
  ignore = function (file, projectDir, PATH) {
    return /\.git|scss\.md|[\/\\]doc[\/\\]/i.test(file.path)
  },
  exclude = function (platform, file, projectDir, PATH) {
    let name = platform.name, fileName = file.name;
    let exc = 'wx|my';
    return (
      /\.git|scss|\.md/i.test(file.path)
      ||
      new RegExp(`\\.(${exc.replace(new RegExp(`${name}\\||\\|${name}$`, 'i'), '')})$`, 'i').test(fileName)
    );
  },
  replaceFor = function (platform, file, projectDir, PATH) {
    let name = platform.name;
    return (name !== 'wx' && /\.(wxml|wxs|wxss)$/.test(file.extname)) || new RegExp(`\\.${name}$`, 'i').test(file.name)
  },
  defineFor = function (platform, file, projectDir, PATH) {
    return /\.(wxml|js|wxs|wxss|json)$/.test(file.extname)
  },
  replacer = function (platform, content, file, projectDir, PATH) {
    let {name: fileName, dir: fileDir, extname} = file, {name, srcDir, extnameMap, replaceMap} = platform;
    let fullPath = srcDir + '/' + fileDir + '/' + fileName.replace(new RegExp(`\\.${name}$`, 'i'), '') + (extnameMap && extnameMap[extname] || extname);
    let replace = replaceMap && replaceMap[extname.replace('.', '')]
    if (replace && replace.replaceReg && name !== 'wx') {
      content = content.replace(replace.replaceReg, (m, ...args) => {
        let rep = null;
        args.splice(-2);
        if (!args.some((arg) => {
          if (arg !== undefined && ((rep = replace[arg])) != null) {
            return true
          }
        })) {
          rep = replace[m];
        }
        let ret;
        try {
          ret = typeof rep === "function" ? rep(m, args) : rep
        } catch (e) {
          console.error(e)
        }
        return ret != null ? ret : m
      })
    }
    return {
      //fileName:fullName,//处理后的文件名
      fullPath: fullPath,//处理后的文件全路径
      content//处理后的
    }
  }

/**
 * @name appConvertConfig
 * @typedef AppConvertConfig
 */
const appConvertConfig = {
  "sourcePath": "src",
  "buildPath": "builds",
  "ignore": ignore,
  "enabled": false,
  "builds": [
    {
      "name": "wx",
      "define": "WX",
      "enabled": true,
      "exclude": exclude,
      "replaceFor": replaceFor,
      "replacer": replacer,
      "defineFor": defineFor
    },
    {
      "name": "my",
      "define": "MY",
      "enabled": true,
      "exclude": exclude,
      "replaceFor": replaceFor,
      "replacer": replacer,
      "defineFor": defineFor,
      "replaceMap": {
        wxml: {
          replaceReg: /(?:\s)((bind|catch):*([a-zA-Z]+)|wx:)|\.wxml/g,
          "bind": (m, args) => {
            let event = args[2];
            return ` on${event.replace(/./, (m) => m.toUpperCase())}`
          },
          "catch": (m, args) => {
            let [, on, event] = args;
            return ` ${on}${event.replace(/./, (m) => m.toUpperCase())}`
          },
          "wx:": " a:",
          ".wxml": '.axml',
        },
        wxss: {
          replaceReg: /\.wxss/g,
          ".wxss": ".acss"
        },
        wxs: {
          replaceReg: /\.wxs/g,
          ".wxs": ".sjs"
        }
      },
      extnameMap: {
        ".wxml": ".axml",
        ".wxss": ".acss",
        ".wxs": ".sjs"
      }
    }
  ]
}
module.exports = appConvertConfig