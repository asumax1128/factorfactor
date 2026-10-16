// Loaded by the loopback development server only. Not referenced by public HTML.
(()=>{
 if(!['localhost','127.0.0.1'].includes(location.hostname))throw Error('EMULATOR_BOOTSTRAP_LOOPBACK_ONLY');
 const initialize=firebase.initializeApp.bind(firebase);
 firebase.initializeApp=(config,...args)=>{const app=initialize({projectId:'demo-factorfactor-tower',apiKey:'emulator-only',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},...args);app.database().useEmulator('127.0.0.1',9000);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});return app};
})();
