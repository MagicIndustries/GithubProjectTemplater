var GitHubAPI = require('github');
var issues = require('../data/issues.json');
var labels = require('../data/labels.json');
var apiDelay = 1000;

var repoOwner = 'LithodomosVR';
var repoName = "testproject";

var gh = new GitHubAPI({
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  headers: {
    "user-agent": "GitHub Project Templater"
  },
  Promise: require('bluebird'),
  followRedirects: false,
  timeout: 5000
});

var temp = gh.authenticate({
    type: "oauth",
    token: "1fae32648d7a8a9f593ce2b63aa3e6d33b7bbae0"
});

// remove all current repo labels
gh.issues.getLabels({
  owner: repoOwner,
  repo: repoName,
  per_page: 100
}).then(function (_labels) {
  var promiseStack = [];
  _labels.data.forEach(function (item) {
    promiseStack.push(
      gh.issues.deleteLabel({
        owner: repoOwner,
        repo: repoName,
        name: item.name
      }).catch (function (error) {
        console.log('Error: ', error);
      }));
  });
  Promise.all(promiseStack).then(function () {
    var promiseStack2 = [];
    labels.forEach(function (item) {
      var func = function (_item) {
        return function () {
          console.log(_item)
          return gh.issues.createLabel({
            owner: repoOwner,
            repo: repoName,
            name: item.name,
            color: item.color,
          }).then(function (result) {
            return result;
          });
        }
      }(item);
      promiseStack2.push(func)
    })
    promiseStack2.reduce(function (promise, thing) {
      return promise.then(function(result) {
        return thing().then(function (result) {
          return result;
        });
      });
    }, Promise.resolve())
  });
});




// // loop over the preset issues
// for (var i=0; i<issues.length; i++) {
//   // use a closure because we're async
//   var func = function (item) {
//     // one per second to ensure the api rate limit doesn't kill us
//     setInterval(function () {
//       // create the issue
//       gh.issues.create(item);
//     }, apiDelay);
//   }(issues[i]);
// }
