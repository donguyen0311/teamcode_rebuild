var config = {
    hostname: 'localhost',
    port: 5000,
    database_url: 'mongodb://teamcode.tk/teamcode',
    mongo: {
        user: 'locpham',
        pass: 'teamcode',
        useMongoClient: true,
        authSource: 'admin'
    },
    secret_key: 'nguyentando'
}
module.exports = config;