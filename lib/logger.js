const ora = require('ora')

module.exports = ora()

module.exports.of = (promise, opts) => {
  ora.promise(promise, opts)
  return promise.then(res => [res]).catch(err => [null, err])
}
