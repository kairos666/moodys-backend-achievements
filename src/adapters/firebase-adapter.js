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

// getter for firebaseDBInstance
let getInstance = function(app) {
    // pass instance or create one
    if (!firebaseDBInstance && app) {
        firebaseDBInstance = createInstance(app);
        logger.log('firebaseDBInstance singleton was created');
    } else if(!firebaseDBInstance && !app) {
        logger.error('Couldn\'t create firebaseDBInstance - was missing feathers app reference');
    }
    return firebaseDBInstance;
};

/**
 * get firebase DB snapshot from a ref or query
 * @param {*} dbRef
 */
let pfirebaseDBSnapshot = function(dbRef) {
    if (!dbRef) reject(new Error('missing firebase ref in - pfirebaseDBSnapshot function call'));
    return new Promise((resolve, reject) => {
        dbRef.once('value', snapshot => {
            resolve(snapshot.val());
        }, error => {
            // couldn't retrieve data from firebase
            reject(error);
        });
    });
}

module.exports = {
    getFirebaseDBInstance: getInstance,
    pfirebaseDBSnapshot: pfirebaseDBSnapshot
};