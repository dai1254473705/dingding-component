const validate = require('./validateComponents');
const arg = require('arg');

const args = arg({
  '--dir': String,
  '-d': '--dir',
});

const dir = args['--dir'];

if (!dir) {
  console.error('未找到-d参数，请使用如下命令：node ./srcipts/index.js -d <componentsDir>');
  return;
}

validate(dir);
