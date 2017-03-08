var GitHubAPI = require('github');
var labels = require('../data/labels.json');
var issues = require('../data/issues.json');
var milestones = require('../data/milestones.json');
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
  console.log('blah00')
  var deletePromises = [];
  _labels.data.forEach(function (item) {
    console.log('blah01')
    deletePromises.push(
      gh.issues.deleteLabel({
        owner: repoOwner,
        repo: repoName,
        name: item.name
      }).catch (function (error) {
        console.log('Error: ', error);
      }));
  });
  Promise.all(deletePromises).then(function () {
    console.log('blah02')
    var labelPromises = [];
    labels.forEach(function (item) {
      console.log('blah03')
      var func = function (_item) {
        console.log('blah04')
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
      labelPromises.push(func);
    });
    var labelPromise = labelPromises.reduce(function (promise, thing) {
      return promise.then(function(result) {
        return thing().then(function (result) {
          return result;
        });
      });
    }, Promise.resolve())

    labelPromise.then(function () {
      console.log('blah1')
      gh.issues.getMilestones({
        owner: repoOwner,
        repo: repoName,
        per_page: 100
      }).then(function (_milestones) {
        console.log('blah2')
        var deleteMSPromises = [];
        _milestones.data.forEach(function (milestone) {
          console.log('blah3')
          deleteMSPromises.push(
            gh.issues.deleteMilestone({
              owner: repoOwner,
              repo: repoName,
              number: milestone.number
            })
          )
        });
        Promise.all(deleteMSPromises).then(function (result) {
          console.log('blah4')
          var milestonePromises = [];
          milestones.forEach(function (item) {
            console.log('blah5')
            var func = function (_item) {
              return function () {
                console.log(_item)
                return gh.issues.createMilestone({
                  owner: repoOwner,
                  repo: repoName,
                  title: item.title,
                  state: item.state,
                  description: item.description,
                  due_on: item.due_on || new Date()
                }).then(function (result) {
                  return result;
                }).catch (function (error) {
                  console.log('Error: ', error);
                });
              }
            }(item);
            milestonePromises.push(func);
          });
          var milestonePromise = milestonePromises.reduce(function (promise, thing) {
            return promise.then(function(result) {
              return thing().then(function (result) {
                return result;
              });
            });
          }, Promise.resolve());

          milestonePromise.then(function () {
            console.log('blah4')
            var issuePromises = [];
            issues.forEach(function (item) {
              console.log('blah5')
              var func = function (_item) {
                return function () {
                  console.log(_item)
                  return gh.issues.create({
                    owner: repoOwner,
                    repo: repoName,
                    title: item.title,
                    state: item.state,
                    description: item.description,
                    due_on: item.due_on || new Date()
                  }).then(function (result) {
                    return result;
                  }).catch (function (error) {
                    console.log('Error: ', error);
                  });
                }
              }(item);
              issuePromises.push(func)
            })
            var issuePromise = issuePromises.reduce(function (promise, thing) {
              return promise.then(function(result) {
                return thing().then(function (result) {
                  return result;
                });
              });
            }, Promise.resolve());

            issuePromise.then(function () {

            });

          });
        });
      });
    });
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
