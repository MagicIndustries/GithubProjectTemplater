var GitHubAPI = require('github');
var labels = require('../data/labels.json');
var issues = require('../data/issues.json');
var milestones = require('../data/milestones.json');
var config = require('../config');

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
    token: config.oAuthToken
});

// remove all current repo labels
gh.issues.getLabels({
  owner: config.repoOwner,
  repo: config.repoName,
  per_page: 100
}).then(function (_labels) {

  var deletePromises = [];

  // loop over the existing labels
  _labels.data.forEach(function (item) {
    // delete the label
    deletePromises.push(
      gh.issues.deleteLabel({
        owner: config.repoOwner,
        repo: config.repoName,
        name: item.name
      }).catch (function (error) {
        console.log('Error: ', error);
      }));
  });

  // When the labels are all deleted, move on
  Promise.all(deletePromises).then(function () {
    var labelPromises = [];

    // loop over the labels to be added
    labels.forEach(function (item) {
      // closure for reducer execution
      var func = function (_item) {
        return function () {
          return gh.issues.createLabel({
            owner: config.repoOwner,
            repo: config.repoName,
            name: item.name,
            color: item.color,
          }).then(function (result) {
            return result;
          });
        }
      }(item);
      labelPromises.push(func);
    });

    // reduce through the promises ensuring we do one at a time,
    // to avoid the bounce issues on github api
    var labelPromise = labelPromises.reduce(function (promise, thing) {
      return promise.then(function(result) {
        return thing().then(function (result) {
          return result;
        });
      });
    }, Promise.resolve())

    // When all the labels are uploaded...
    labelPromise.then(function () {

      // grab any current milestones
      gh.issues.getMilestones({
        owner: config.repoOwner,
        repo: config.repoName,
        per_page: 100
      }).then(function (_milestones) {

        var deleteMSPromises = [];

        // loop over the existing milestones
        _milestones.data.forEach(function (milestone) {
          // delete the milestone
          deleteMSPromises.push(
            gh.issues.deleteMilestone({
              owner: config.repoOwner,
              repo: config.repoName,
              number: milestone.number
            })
          )
        });

        // When all the milestones are deleted...
        Promise.all(deleteMSPromises).then(function (result) {
          var milestonePromises = [];
          // loop over the milestones to be created
          milestones.forEach(function (item) {
            // closure for reducer execution
            var func = function (_item) {
              return function () {
                return gh.issues.createMilestone({
                  owner: config.repoOwner,
                  repo: config.repoName,
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

          // reduce through the promises ensuring we do one at a time,
          // to avoid the bounce issues on github api
          var milestonePromise = milestonePromises.reduce(function (promise, thing) {
            return promise.then(function(result) {
              return thing().then(function (result) {
                return result;
              });
            });
          }, Promise.resolve());

          // When all the milestones are uploaded
          milestonePromise.then(function () {

            var issuePromises = [];

            // loop over the issues to be created
            issues.forEach(function (item) {
              // closure for reducer execution
              var func = function (_item) {
                // create the issue
                return function () {
                  return gh.issues.create({
                    owner: config.repoOwner,
                    repo: config.repoName,
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
            });

            // reduce through the promises ensuring we do one at a time,
            // to avoid the bounce issues on github api
            var issuePromise = issuePromises.reduce(function (promise, thing) {
              return promise.then(function(result) {
                return thing().then(function (result) {
                  return result;
                });
              });
            }, Promise.resolve());

            // when all the issues are uploaded...
            issuePromise.then(function () {

            });

          });
        });
      });
    });
  });
});
