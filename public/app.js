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
  var problemData = learnjs.problems[problemNumber-1];
  var resultFlash = view.find('.result');
  function checkAnswer() {
    var answer = view.find('.answer').val();
    var test = problemData.code.replace('__', answer) + ';problem();';
    try {
      return eval(test);
    } catch(e) {
      return false;
    }
  }
  function checkAnswerClick() {
    var correct = learnjs.buildCorrectFlash(problemNumber);
    learnjs.flashElement(resultFlash, checkAnswer()?correct:'Incorrect!');
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

    return view;
}
learnjs.showView = function(hash) {
	var routes = {
		"#problem": learnjs.problemView,
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
};

learnjs.awsRefresh = function() {
  var deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err){
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
    return deferred.promise();
  });
};

learnjs.identity = new $.Deferred();

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