var crypto = require('crypto');
/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
var genRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length); /** return required number of characters */
};
exports.genRandomString = genRandomString;

var genRandomSpecialString = (length) => {
    var text = "";
    var char = "!@#$%^&*()_+=~";
    for (var i = 0; i < length; i++) {
        text += char.charAt(Math.floor(Math.random() * char.length));
    }
    return text;
};

exports.genRandomSpecialString = genRandomSpecialString;

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 */
var sha512 = (password) => {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var key = crypto.pbkdf2Sync(password, salt, 100000, 512, 'sha512'); /** Hashing algorithm sha512 with 100000 rounds and digest 512 */
    return {
        salt: salt,
        password_encrypt: key.toString('hex')
    };
};
exports.sha512 = sha512;
/**
 * comapreSync password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 * @param {string} password_encrypt - List of required fields.
 * @returns {boolean} result
 */
var compareSync = (password, salt, password_encrypt) => {
    var key = crypto.pbkdf2Sync(password, salt, 100000, 512, 'sha512');
    return (key.toString('hex') === password_encrypt) ? true : false;
};
exports.compareSync = compareSync;

/**
 * Callback.
 *
 * @callback callbackFunction
 * @param {boolean} result - A Boolean.
 */
/**
 * comapre password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 * @param {string} password_encrypt - List of required fields.
 * @param {callbackFunction} callback - Callback.
 */
var compare = (password, salt, password_encrypt, callback) => {
    var key = crypto.pbkdf2Sync(password, salt, 100000, 512, 'sha512');
    var result =  (key.toString('hex') === password_encrypt) ? true : false;
    if(typeof callback === 'function') {
        callback(result);
    }
};
exports.compare = compare;