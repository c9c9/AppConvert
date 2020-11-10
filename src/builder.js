const _PATH = require('path'), {readFileSync, writeFileSync, copyFileSync, statSync, readdirSync, makeDirSync} = require("./file"),
  style = require('./log-style');
let PATH = _PATH;
/**
 * @type {Object<LetAppConvertConfig|*>}
 */
let buildConfig, buildType

/**
 *
 * @param init_type
 * @param {Object<LetAppConvertConfig|*>} init_config
 * @param init_PATH
 */
function buildInit(init_type, init_config, init_PATH) {
  PATH = init_PATH || PATH
  buildConfig = init_config;
  buildType = init_type;
  let {buildFiles, enabledBuilds, enabled} = buildConfig;
  if (enabled) {
    eachBuildFiles(buildFiles, enabledBuilds)
  }
}

function eachBuildFiles(buildFiles, builds) {
  if (!buildFiles.length || !builds.length) {
    return
  }
  let projectPath = buildConfig.projectPath;
  buildFiles.forEach((file) => {
    if (!buildConfig.ignore(file, projectPath, PATH)) {
      eachBuilds(builds, file)
    }
  })
}

/**
 *
 * @param builds
 * @param file
 */
function eachBuilds(builds, file) {
  if (!builds.length) {
    return
  }
  let _builds = [];
  let projectPath = buildConfig.projectPath;
  builds.forEach((platform) => {
    if (!platform.exclude(platform, file, projectPath)) {
      _builds.push(platform)
    }
  })
  if (_builds.length) {
    let {fullPath} = file;
    const {error, state, result: stats} = statSync(fullPath);
    if (!state) {
      return processEnd(1, error)
    }
    if ((file.isDir = stats.isDirectory())) {
      const {error, state, result: paths} = readdirSync(fullPath);
      if (!state) {
        return processEnd(1, error)
      }
      let sourceFullPath = buildConfig.sourceFullPath
      let buildFiles = paths.map((path) => {
        return toFileBaseInfo(PATH.resolve(fullPath, path), sourceFullPath, PATH)
      })
      eachBuildFiles(buildFiles, _builds)
    } else {
      eachFileBuilds(file, _builds)
    }
  }
}

let getFiled = function (filed, file, charset) {
  if (filed == null) {
    let {state, error, result} = readFileSync(file.fullPath, charset);
    if (!state || result == null) {
      filed = processEnd(1, error)
    } else {
      filed = result
    }
  }
  return filed
}

function makeFileDir(filePath) {
  return makeDirSync(PATH.dirname(filePath), null, PATH)
}

function eachFileBuilds(file, builds) {
  let projectPath = buildConfig.projectPath, filed = null, isCopy = true, charset = 'utf-8';
  //TODO 增加删除文件功能
  //TODO 增加文件缓存判断，跳过相同文件再次修理
  //TODO 增加重新编译功能
  for (let i = 0, length = builds.length, platform; i < length; i++) {
    platform = builds[i];
    let {defineOption} = platform, type;
    let content = null;
    if (defineOption && (type = platform.defineFor(platform, file, projectPath, PATH))) {
      isCopy = false;
      filed = getFiled(filed, file, charset);
      if (filed === false) {
        return filed
      }
      let {state, error, result} = defineHandle(filed, defineOption);
      if (!state) {
        return processEnd(1, file.fullPath + '\n' + result + '\n' + error)
      }
      content = result;
    }
    if (platform.replaceFor(platform, file, projectPath, PATH)) {
      isCopy = false;
      content = content !== null ? content : getFiled(filed, file, charset);
      if (filed === false) {
        return false;
      }
      try {
        content = platform.replacer(platform, content, file, projectPath, PATH)
      } catch (e) {
        content = null;
        processEnd(1, platform.name + ':' + file.fullPath + '\n' + e)
      }
    }

    let path, data;
    const processError = function (error) {
      processEnd(1, platform.name + ':' + file.fullPath + ':' + (path || '') + '\n' + error)
    }
    if (isCopy) {
      if (file.newPath) {
        path = file.newPath;
        file.newPath = null;
      } else {
        path = file.path;
      }
      path = PATH.resolve(platform.srcDir, path);
      let {state, error} = makeFileDir(path);
      if (state) {
        let {state, error} = copyFileSync(file.fullPath, path);
        if (!state) {
          processError(error)
        }
      } else {
        processError(error)
      }
    } else if (content != null) {
      if (typeof content === "string") {
        path = PATH.resolve(platform.srcDir, file.path);
        data = content;
      } else {
        path = content.fullPath;
        data = content.content;
      }
      if (path && data != null) {
        let {state, error} = makeFileDir(path);
        if (state) {
          let {state, error} = writeFileSync(path, data)
          if (!state) {
            processError(error)
          }
        } else {
          processError(error)
        }
      } else {
        processEnd(1, platform.name + ':' + (!path ? '目标文件路径为空' : '目标内容为空') + '\n' + file.fullPath + ':' + (path || '') + '\n')
      }
    } else {
      processEnd(1, platform.name + ':' + ('目标内容为空') + '\n' + file.fullPath + '\n')
    }
  }

}

function defineHandle(content, defineOption, fn, args) {
  let match = content.match(/(\/\/|\/\*|<!--|"?#-+|) *#+((IF) +([ \w.~+\-*=%^/&|!()\[\]]+)|(ELSE *IF) +([ \w.~+\-*=%^/&|!()\[\]]+)|ELSE|END *IF) *(\*\/|-->|[\n\r]{1,2}|" *: *"" *,?|#-+#)/i);
  if (!match) {
    let state = true, error;
    if (fn) {
      fn = `${fn}\n;out+=${JSON.stringify(content)};return out;`
      try {
        let func = new Function(`{${args.join(',')}}={}`, fn);
        content = func(defineOption)
      } catch (e) {
        state = false;
        error = e;
        content = 'throw ' + JSON.stringify(e + "") + '\n' + `function anonymous({${args.join(',')}}={}){${fn}}}`
      }
    }
    return {result: content, state, error}
  }
  let out = content.slice(0, match.index);
  content = content.slice(match.index + match[0].length);
  let key = (match[5] || match[3] || match[2]).toUpperCase().replace(/\s+/, '');
  args = args || [];
  if (fn == null) {
    fn = 'let out = "";';
  }
  fn += `out+=${JSON.stringify(out)};`
  let ex;
  switch (key) {
    case "IF":
      fn += `\nif(${ex = match[4]}){\n`;
      break;
    case "ELSEIF":
      fn += `\n}else if(${ex = match[6]}){\n`;
      break;
    case "ELSE":
      fn += `\n}else{\n`;
      break;
    case "ENDIF":
      fn += `\n}`;
      break;
  }
  if (ex && (ex = ex.match(/\w+/g))) {
    ex.forEach((arg) => {
      if (args.indexOf(arg) === -1) {
        args.push(arg)
      }
    })
  }
  return defineHandle(content, defineOption, fn, args);
}


function returnFalse() {
  return false
}

function processEnd(code, error) {
  process.exitCode = (code = code || 0) || process.exitCode
  if (code !== 0) {
    process.stderr.write(style(style.red, "ERROR:" + (error || '') + '\n'));
    return false
  }
  return true
}

function toFileBaseInfo(fileFullPath, sourceFullPath, Path) {
  let extname = Path.extname(fileFullPath),
    basename = Path.basename(fileFullPath),
    path = fileFullPath.replace(sourceFullPath, '').replace(/^[\/\\]+/, ''),
    fullDir = sourceFullPath === fileFullPath ? sourceFullPath : Path.dirname(fileFullPath)
  ;
  return {
    name: basename.replace(extname, ''),
    extname: extname,
    fullName: basename,
    dir: sourceFullPath === fileFullPath ? "" : fullDir.replace(sourceFullPath, ''),
    fullDir: fullDir,
    path: path,
    fullPath: fileFullPath
  }
}

function toRelPath(path) {
  return (path + '').replace(/^\s+[\/\\]+/, '')
}

module.exports = {
  processEnd: processEnd,
  configMake: function (config, ProjectDir, CD, buildPaths, platformAgs, Path = _PATH) {
    config.sourcePath = config.sourcePath || 'src';
    config.buildPath = config.buildPath || 'build';
    config.projectPath = ProjectDir;
    let sourceFullPath = config.sourceFullPath = Path.resolve(config.projectPath, toRelPath(config.sourcePath)),
      sourceFullPathLowerCase = sourceFullPath.toLowerCase();
    config.buildFullPath = Path.resolve(config.projectPath, toRelPath(config.buildPath));
    let buildFiles = config.buildFiles = [];
    buildPaths.forEach((filePath) => {
      let fileFullPath = Path.resolve(CD, toRelPath(filePath));
      if (fileFullPath.toLowerCase().indexOf(sourceFullPathLowerCase) === 0) {
        buildFiles.push(toFileBaseInfo(fileFullPath, sourceFullPath, Path));
      }
    });
    if (buildFiles.length === 0) {
      buildFiles.push(toFileBaseInfo(sourceFullPath, sourceFullPath, Path));
    }
    config.builds = config.builds || [];
    config.enabledBuilds = [];
    const setFunction = function (item, ...names) {
      names.forEach((name) => {
        let fun = item[name]
        if (fun && typeof fun === "string") {
          try {
            fun = require(Path.resolve(config.projectPath, toRelPath(fun)))
          } catch (e) {
            processEnd(1, e)
          }
        }
        item[name] = typeof fun === "function" ? fun : returnFalse();
      })
    }
    config.builds.forEach((item) => {
      item.name = item.name && (item.name + '').trim()
      let name = item.name.toLowerCase();
      item.enabled = name && (platformAgs.length === 0 ? item.enabled : platformAgs.indexOf(name) > -1);
      let defineVar = item.define;
      defineVar = typeof defineVar === "string" ? (defineVar = defineVar.trim()) ? defineVar.split(/\s+/) : null : defineVar;
      if (Array.isArray(defineVar)) {
        if (defineVar.length) {
          let defineOption = item.defineOption = {}
          defineVar.forEach((name) => {
            defineOption[name] = true;
          });
        }
      } else if (typeof defineVar === "object") {
        item.defineOption = defineVar;
      } else {
        item.defineOption = null
      }
      if (item.enabled) {
        item.dir = Path.resolve(config.buildFullPath, toRelPath(item.name))
        item.srcDir = Path.resolve(item.dir, 'src')
        setFunction(item, "defineFor", "exclude", "replacer", "replaceFor")
        config.enabledBuilds.push(item);
      }
    })
    setFunction(config, "ignore");
    config.enabled = config.enabled && config.enabledBuilds.length !== 0;
    return config
  },
  build: function (config, PATH) {
    return buildInit(1, config, PATH)
  },
  rebuild: function (config, PATH) {
    return buildInit(0, config, PATH)
  }
}

/*

#ifdef 宏名称          判断某个宏是否被定义，若已定义，执行随后的语句
afdsfdssd
#ifndef 宏名称         与#ifdef相反，判断某个宏是否未被定义
sdsdfsdfsds
#else                 与#if, #ifdef, #ifndef对应, 若这些条件不满足，则执行#else之后的语句，相当于C语法中的else
sdfsdfsdf
#endif                #if, #ifdef, #ifndef这些条件命令的结束标志.

* */


//(?<=<)(?>[^>]*)(?=>)