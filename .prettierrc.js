module.exports = {
  // 一行最多字符数
  printWidth: 100,
  // 使用单引号
  singleQuote: true,
  // 末尾不需要逗号
  trailingComma: 'none',
  // 大括号内的首尾需要空格
  bracketSpacing: true,
  // 箭头函数，只有一个参数的时候，不需要括号
  arrowParens: 'avoid',
  // 使用默认的折行标准
  proseWrap: 'preserve',
  // 根据显示样式决定 html 要不要折行
  htmlWhitespaceSensitivity: 'css',
  // 换行符使用 lf
  endOfLine: 'lf',
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的 @prettier
  requirePragma: false,
  // 不需要自动在文件开头插入 @prettier
  insertPragma: false,
  // 使用默认的换行标准
  proseWrap: 'preserve',
  // 对象的 key 仅在必要时用引号
  quoteProps: 'as-needed',
  // jsx 不使用单引号，而使用双引号
  jsxSingleQuote: false,
  // jsx 标签的反尖括号需要换行
  jsxBracketSameLine: false,
  // 缩进使用2个空格
  tabWidth: 2,
  // 不使用缩进符，而使用空格
  useTabs: false,
  // 行尾需要有分号
  semi: true,
  // 在对象或数组最后一个元素后面是否加逗号
  trailingComma: 'none',
  // 对象的大括号之间是否有空格
  bracketSpacing: true,
  // 箭头函数，只有一个参数的时候，也需要括号
  arrowParens: 'avoid',
  // markdown 文本换行
  proseWrap: 'preserve',
  // html 空格敏感度
  htmlWhitespaceSensitivity: 'css',
  // vue 文件中的 script 和 style 内不用缩进
  vueIndentScriptAndStyle: false,
  // 换行符使用 lf
  endOfLine: 'lf',
  // 格式化嵌入的内容
  embeddedLanguageFormatting: 'auto',
  // html, vue, jsx 中每个属性占一行
  singleAttributePerLine: false,
  // 对 WXML 和 WXSS 文件进行格式化
  overrides: [
    {
      files: '*.wxml',
      options: {
        parser: 'html'
      }
    },
    {
      files: '*.wxss',
      options: {
        parser: 'css'
      }
    }
  ]
}; 