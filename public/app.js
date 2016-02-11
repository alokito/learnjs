'use strict';
var learnjs = {poolId: 'us-east-1:2c986d09-9eb7-489e-8dd9-b9b390a31c11'};
learnjs.problems = [
  {
    description: "What is truth?",
    code: "function problem() { return __; }"
  },
  {
    description: "Simple Math",
    code: "function problem() { return 42 === 6 * __; }"
  },
  {
    description: "Object Access",
    code: "function problem() { var foo = {a : 11}; return foo.a === __; }"
  },

];
learnjs.triggerEvent = function(evt, args) {
  $('.view-container>*').trigger(evt, args);
}
learnjs.flashElement = function($el, content){
  $el.fadeOut('fast', function (){
    $el.html(content);
    $el.fadeIn();
  });
};
learnjs.applyObject = function(obj, $el) {
  for (var key in obj) {
    $el.find('[data-name="' + key + '"]').text(obj[key]);
  }
}
learnjs.template = function(name) {
  return $('.templates .' + name).clone();
}
learnjs.buildCorrectFlash = function(problemNumber) {
  var correct = learnjs.template('correct-flash');
  var link = correct.find('a');
  if (problemNumber + 1 < learnjs.problems.length) {
    link.attr('href', '#problem-'+(problemNumber+1));
  } else {
    link.attr('href', '');
    link.text("All Done!");
  }
  return correct;
}
learnjs.landingView = function(){
  return learnjs.template('landing-view');
};
learnjs.problemView = function(data) {
	var problemNumber = parseInt(data, 10);
  var view = learnjs.template('problem-view');
  var answer = view.find('.answer');
  var problemData = learnjs.problems[problemNumber-1];
  var resultFlash = view.find('.result');
  function checkAnswer(answer) {
    var test = problemData.code.replace('__', answer) + ';problem();';
    try {
      return eval(test);
    } catch(e) {
      return false;
    }
  }
  function checkAnswerClick() {
    var correctContent = learnjs.buildCorrectFlash(problemNumber);
    var checked  = checkAnswer(answer.val());
    learnjs.flashElement(resultFlash, checked?correctContent:'Incorrect!');
    if (checked) {
      learnjs.saveAnswer(problemNumber, answer.val());
      learnjs.popularAnswers(problemNumber).then(function(answers) {
        var payload = JSON.parse(answers.Payload);
        if (payload.length > 0) {
          var table = "Popular Answers:<table><tr><th>Answer</th><th>Count</th></tr>"
          for (var i = 0; i < payload.length; i++) {
            var a = payload[i];
            table += "<tr><td>"+ a.text+"</td><td>" + a.count +"</td></tr>";
          }
          table += "</table>";
          var $d = view.find('.popularAnswers').append(table);
        }
      });
    }
    return false;
  }

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #'+problemNumber);
  learnjs.applyObject(problemData, view);
  if (problemNumber < learnjs.problems.length) {
    var buttonItem = learnjs.template('skip-btn');
    buttonItem.find('a').attr('href', '#problem-' + (problemNumber+1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView', function(){
      buttonItem.remove();
    });
  }
  learnjs.fetchAnswer(problemNumber).then(function(data) {
    if (data.Item) {
      answer.val(data.Item.answer);
    }
  }, function(p) {
    window.alert('p: ' + p);
  });
  learnjs.countAnswers(problemNumber).then(function(data){
    view.find('.answerCount').text("Answered by " + data.Count +" users");
  }, function(p) {
    window.alert('p: ' + p);
  });
  return view;
}
learnjs.showView = function(hash) {
	var routes = {
    "#problem": learnjs.problemView,
    "#profile": learnjs.profileView,
    '#': learnjs.landingView,
    '': learnjs.landingView
	};
	var hashParts = hash.split('-');
	var viewFn = routes[hashParts[0]];
	if (viewFn) {
    learnjs.triggerEvent('removingView', []);
		$('.view-container').empty().append(viewFn(hashParts[1]));
	}

};
learnjs.appOnReady = function() {
	function showHashView(){
		learnjs.showView(window.location.hash);
	}
	$(window).on('hashchange', showHashView);
	showHashView();
  learnjs.identity.then(learnjs.addProfileLink);
};

learnjs.awsRefresh = function() {
  var deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err){
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
};

learnjs.addProfileLink = function(profile) {
  var link = learnjs.template('profile-link');
  link.find('.email').text(profile.email);
  $('.signin-bar').prepend(link);
}


learnjs.identity = new $.Deferred();


learnjs.profileView = function() {
  var view = learnjs.template('profile-view');
  learnjs.identity.done(function(identity) {
    view.find('.email').text(identity.email);
  });
  return view;
}

function googleFail() {
  learnjs.awsRefresh();
  window.alert("Denied!");
}

function googleSignOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    learnjs.awsRefresh();
    console.log('User signed out.');
  });
  return false;
}

function googleSignIn(googleUser) {

  function refresh() {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(userUpdate) {
      var creds = AWS.config.credentials;
      var newToken = userUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    });
  }

  var authResponse= googleUser.getAuthResponse();
  var id_token = authResponse.id_token;
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  });

  learnjs.awsRefresh().then(function(id) {
    learnjs.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    });
  });
}

learnjs.sendAwsRequest = function(req, retry) {
  var promise = new $.Deferred();
  req.on('error', function(error) {
    if (error.code === 'CredentialsError') {
      learnjs.identity.then(function(identity){
        return identity.refresh().then(function(){
          return retry();
        }, function(resp) {
          promise.reject(resp);
        });
      });
    } else {
      promise.reject(error);
    }
  });

  req.on('success', function(resp) {
    promise.resolve(resp.data);
  });
  req.send();
  return promise;
};

learnjs.saveAnswer = function(problemId, answer) {
  return learnjs.identity.then(function(identity){
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'SALDAAL1-learnjs',
      Item: {
        userId: identity.id,
        problemId: problemId,
        answer: answer
      }
    }
    return learnjs.sendAwsRequest(db.put(item), function(){
      return learnjs.saveAnswer(problemId, answer);
    });
  });
};

learnjs.fetchAnswer = function(problemId) {
  var def = new $.Deferred();

  learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: "SALDAAL1-learnjs",
      Key: {
        userId: identity.id,
        problemId: problemId
      }
    };
    learnjs.sendAwsRequest(db.get(item), function(){
      return learnjs.fetchAnswer(problemId);
    }).then(function(r ){
      def.resolve(r);
    }, def.reject);
  }, def.reject);
  return def;
}

learnjs.countAnswers = function(problemId) {
  var def = new $.Deferred();
  learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var params = {
      TableName: 'SALDAAL1-learnjs',
      Select: 'COUNT',
      FilterExpression: 'problemId = :problemId',
      ExpressionAttributeValues: {':problemId': problemId}
    };
    learnjs.sendAwsRequest(db.scan(params), function() {
      return learnjs.countAnswers(problemId);
    }).then(def.resolve, def.reject);
  });
  return def;
}

learnjs.popularAnswers = function(problemId) {
  var def = new $.Deferred();
  learnjs.identity.then(function() {
    var lambda = new AWS.Lambda();
    var params = {
      FunctionName: 'SALDAAL1-popularAnswers',
      Payload: JSON.stringify({problemId: problemId})
    }
    return learnjs.sendAwsRequest(lambda.invoke(params), function(){
      return learnjs.popularAnswers(problemId);
    }).then(def.resolve, def.reject);
  });
  return def;
}