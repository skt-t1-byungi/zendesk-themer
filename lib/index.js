const Client = require('./Client.js')

const login = module.exports = opts => Client.login(opts)

login.Client = Client
