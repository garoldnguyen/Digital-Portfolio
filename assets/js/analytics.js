/* Firebase Analytics: same project and config as the previous page. Kept in its own file so the page itself has no
   inline script (the Content-Security-Policy in firebase.json does not allow any). It does nothing on localhost, so
   development traffic is not counted. */
if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js')
  ]).then(function (m) {
    var app = m[0].initializeApp({
      apiKey: 'AIzaSyBLUWzTIlxHxC_u6-P_1K-iYn8QVn7aYA0',
      authDomain: 'digital-portfolio-dc046.firebaseapp.com',
      projectId: 'digital-portfolio-dc046',
      storageBucket: 'digital-portfolio-dc046.firebasestorage.app',
      messagingSenderId: '656310424605',
      appId: '1:656310424605:web:8c32dfc95a0c0f2cf922f4',
      measurementId: 'G-53S3VES2ST'
    });
    m[1].getAnalytics(app);
  }).catch(function () { /* analytics is optional: never let it break the page */ });
}
