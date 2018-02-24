const firebase = require('firebase');
const logger = require('winston');

// singleton firebaseDB instance
let firebaseDBInstance;

// create and config instance
let createInstance = function(app) {
    const firebaseConfig = app.get('firebase');

    // firebase DB app
    const firebaseApp = firebase.initializeApp(firebaseConfig.firebaseAppConfig);
    const firebaseAppDB = firebase.database(firebaseApp);

    // authenticate (user account with access rights for all users registered moods & achievements)
    const firebaseAuth = firebase.auth(firebaseApp);
    firebaseAuth.signInWithEmailAndPassword(firebaseConfig.firebaseAchievementsServiceAuth.email, firebaseConfig.firebaseAchievementsServiceAuth.password).catch(err => {
        logger.error(`couldn't authenticate with firebase - ${err.message}`);
    });

    return firebaseAppDB;
}

module.exports = function (app) {
    // pass instance or create one
    if (!firebaseDBInstance && app) {
        firebaseDBInstance = createInstance(app);
        logger.log('firebaseDBInstance singleton was created');
    } else if(!firebaseDBInstance && !app) {
        logger.error('Couldn\'t create firebaseDBInstance - was missing feathers app reference');
    }
    return firebaseDBInstance;
};