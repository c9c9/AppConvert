const
  style = require('./log-style'),
  {readInputLine} = require('./readInput'),
  fs = require("fs"),
  PATH = require('path');
let
  ProjectDir = "",
  RunAction = "",
  RunActionAgs = [],
  PlatformAgs = [],
  BuildFiles = [],
  // BuildFileTypes = [],
  ProjectConfig;


const
  CD = process.cwd(),
  LAC_DIR = PATH.dirname(__filename),
  CONFIG_FILE_NAME = "app.convert.config.js",
  CONFIG_FILE_PATH = PATH.resolve(LAC_DIR, CONFIG_FILE_NAME);
// CONFIG_FILE_NAME = "app.convert.config.json",
// CONFIG_SCHEMA_NAME = "app.convert.config.schema.json",
// CONFIG_FILE_PATH = PATH.resolve(LAC_DIR, CONFIG_FILE_NAME),
// CONFIG_SCHEMA_PATH = PATH.resolve(LAC_DIR, CONFIG_SCHEMA_NAME);

const {configMake, processEnd, build, rebuild} = require('./builder'), {copyFile, toUrlPath} = require('./file')


async function getConfig(action) {
  let config_file_path = toFullFilePath(CONFIG_FILE_NAME);
  if (!fs.existsSync(config_file_path)) {
    async function next() {
      let code = '' + await readInputLine([style(style.red, `未能找到项目配置文件[${config_file_path}],项目根目录[${ProjectDir}]可能有误,你可以:`),
        style(style.blue, '1.更正项目根目录'),
        style(style.green, '2.在此目录初始化项目'),
        style(style.red, '0.结束' + action),
        ''
      ].join('\n'));
      switch (code) {
        case '0':
          return false;
        case '1':
          return await changeProjectDir();
        case '2':
          return await Actions.init();
        default:
          return await next()
      }
    }

    if (!await next()) {
      return processEnd(1, `未能找到项目配置文件[${config_file_path}]`)
    }
    return getConfig(action)
  }
  try {
    let config = require(config_file_path);
    return ProjectConfig = configMake(config, ProjectDir, CD, BuildFiles, PlatformAgs, PATH);
  } catch (e) {
    console.error(e)
    return processEnd(1, `${config_file_path}不是有效的项目配置。\n`)
  }

}

async function changeProjectDir(msg) {
  let dir = '' + await readInputLine(style(style.red, msg || `请输入新的项目根目录(当前工作目录：${CD}):\n`));
  if (!fs.existsSync(dir)) {
    return await changeProjectDir(`目录${dir}不存在，请重新输入新的项目根目录(当前工作目录：${CD})：`)
  }
  ProjectDir = PATH.resolve(CD, dir);
  return true
}


function toCDDir(dir) {
  return PATH.resolve(CD, toUrlPath(dir))
}

function toFullDir(dir) {
  return PATH.resolve(ProjectDir, toUrlPath(dir))
}

function toFullFilePath(filePath) {
  return PATH.resolve(ProjectDir, filePath);
}

async function _build(method, methodName) {
  ProjectConfig = await getConfig(methodName);
  if (!ProjectConfig) {
    return ProjectConfig
  }
  return method(ProjectConfig, PATH)
}

const Actions = {
  build: async function () {
    return _build(build, 'build')
  },
  rebuild: async function () {
    return _build(rebuild, 'rebuild')
  },
  init: async function () {
    let config_file_path = toFullFilePath(CONFIG_FILE_NAME);
    if (!fs.existsSync(config_file_path)) {
      //await copyFile(CONFIG_SCHEMA_PATH, toFullFilePath(CONFIG_SCHEMA_NAME));

      let ret = await copyFile(CONFIG_FILE_PATH, config_file_path);
      if (!ret.state) {
        return processEnd(1, `${config_file_path}文件创建失败\n`)
      }
    }
    console.log(style(style.green, '初始化完成'));
    return processEnd(0)
  },
  help: async function () {
    let doc = [
      ["init\t\t", "初始化项目"],
      ["build\t\t", "编译项目\n\t\t例子：\tbuild \n\t\t\tbuild path/file1.name path/file2.name,path/file3.name"],
      ["rebuild\t\t", "重新编译项目"],
      ["--project\t", "项目根目录，当不指定将默认为当前目录\n\t\t例子：\t--project=path/path/\n\t\t\t--project:path/path/"],
      ["--platform\t", "指定的平台环境名，\n\t\t例子：\t--platform=wx\n\t\t\t--platform:wx,swan,my"],
    ];

    console.log([style(style.bold, '帮助：')].concat(doc.map((item) => {
      return `${style(style.blue, item[0])}${style(style.green, item[1])}`
    })).join('\n'));
    return processEnd(0);
  }
}

void async function main() {
  process.argv.slice(2).forEach((arg) => {
    arg = arg.trim();
    if (/^--project/i.test(arg)) {
      ProjectDir = arg.replace(/--project[=:]*|['"]/g, '')
    } else if (/^--platform/i.test(arg)) {
      PlatformAgs = arg.replace(/--platform[=:]*|['"]/g, '').toLowerCase().split(',');
    } else if (!RunAction) {
      RunAction = arg.toLowerCase();
    } else {
      RunActionAgs.push(...arg.replace(/['"]/g, '').split(','))
    }
  })
  BuildFiles = RunActionAgs;
  ProjectDir = toCDDir(ProjectDir) || CD;
  await (Actions[RunAction] || Actions['help'])(RunAction);
  process.exit(process.exitCode);
}();
