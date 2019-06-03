const functions = require('firebase-functions');
const admin = require('firebase-admin');

// const express = require('express');
// const app = express();
// making this two line into one line
const app  = require('express')();

admin.initializeApp();

const config = {
  apiKey: "AIzaSyAeHSOdvlJKZjrTbzLF3f_bR_WwfaSq6ZE",
  authDomain: "socialapp-38eba.firebaseapp.com",
  databaseURL: "https://socialapp-38eba.firebaseio.com",
  projectId: "socialapp-38eba",
  storageBucket: "socialapp-38eba.appspot.com",
  messagingSenderId: "717868560838"
};

const firebaseApp = require('firebase');
firebaseApp.initializeApp(config);

const db = admin.firestore();

// exports.getScreams = functions.https.onRequest((req, res) => {
//   db
//     .firestore()
//     .collection('screams')
//     .orderBy('createdAt', 'desc')
//     .get()
//     .then(data => {
//       let screams = [];
//       data.forEach(doc => {
//         screams.push({
//           screamId: doc.id,
//           body: doc.data().body,
//           userHandle: doc.data().userHandle,
//           createdAt: doc.data().createdAt
//         });
//       });
//       return res.json(screams);
//     })
//     .catch(err => console.error(err));
// })

app.get('/screams',(req, res) => {
  db
    .firestore()
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount
        });
      });
      return res.json(screams);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
});

// exports.getScreams = functions.https.onRequest((req, res) => {
//   db
//     .firestore()
//     .collection('screams')
//     .get()
//     .then(data => {
//       let screams = [];
//       data.forEach(doc => {
//         screams.push(doc.data());
//       });
//       return res.json(screams);
//     })
//     .catch(err => console.error(err));
// });

///////////////////////////////////////////////////////////////////////////////

// exports.createScream = functions.https.onRequest((req, res) => {
//   const newScream = {
//     body: req.body.body,
//     userHandle: req.body.userHandle,
//     createdAt: new Date().toISOString()
//   };

//   db
//     .firestore()
//     .collection('screams')
//     .add(newScream)
//     .then(doc => {
//       res.json({ message: `document ${doc.id} created successfully` });
//     })
//     .catch(err => {
//       res.status(500).json({ error: 'something went wrong'});
//       console.error(err)
//     });
// })

const FBAuth = (req, res, next) => {
  
}

// Post one scream
app.post('/scream', FBAuth, (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' });
  }

  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db
    .collection('screams')
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong'});
      console.error(err)
    });
});

const isEmpty = (string) => {
  if (string.trim() === '') {
    return true;
  }
  return false;
}

const isEmail = () => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regEx)) return true;
  else return false;
}

// exports.createScream = functions.https.onRequest((req, res) => {
//   if (req.method !== 'POST') {
//     return res.status(400).json({ error: 'Method not allowed' });
//   }

//   const newScream = {
//     body: req.body.body,
//     userHandle: req.body.userHandle,
//     createdAt: db.firestore.Timestamp.fromDate(new Date())
//   };

//   db
//     .firestore()
//     .collection('screams')
//     .add(newScream)
//     .then(doc => {
//       res.json({ message: `document ${doc.id} created successfully` });
//     })
//     .catch(err => {
//       res.status(500).json({ error: 'something went wrong'});
//       console.error(err)
//     });
// });

// Signup route

exports.getSignUp = functions.https.onRequest((req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    return errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    return errors.email = 'Must be a valid email address';
  }

  if (isEmpty(newUser.password)) {
    return errors.password = 'Must not be empyt';
  }
  if (newUser.password !== newUser.confirmPassword) {
    return errors.confirmPassword = 'Passwords must match';
  }
  if (isEmpty(newUser.handle)) {
    return errors.handle = 'Must not be empty';
  }
  if(Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  // TODO validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: 'this handle is already taken' });
      } else {
        return firebaseApp
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
      // return res.status(201).json({ token });
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email is already in use' });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });

  // firebaseApp
  //   .auth()
  //   .createUserWithEmailAndPassword(newUser.email, newUser.password)
  //   .then(data => {
  //     return res.status(201).json({ message: `user ${data.user.uid} signed up succesfully` });
  //   })
  //   .catch(err => {
  //     console.error(err);
  //     return res.status(500).json({ error: err.code });
  //   });

});

exports.postLogin = functions.https.onRequest((req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if (isEmpty(user.email)) {
    return errors.email = 'Must not be empty';
  }
  if (isEmpty(user.password)) {
    return errors.password = 'Must not be empty';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  firebaseApp
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({token});
    })
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        return res.status(403).json({ general: 'Wrong credential, please try again' });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

// https://baseurl.com/api/

// exports.api = functions.https.onRequest(app);