var config = {
    hostname: 'localhost',
    port: 5000,
    database_url: 'teamcode.tk:27017/teamcode',
    mongo: {
        user: 'teamcode',
        pass: 'donguyen_locpham',
        useMongoClient: true,
        authSource: 'admin'
    },
    secret_key: 'nguyentando'
}
module.exports = config;