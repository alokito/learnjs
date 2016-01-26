'use strict';
var learnjs = {};
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

  return view;
}
learnjs.showView = function(hash) {
	var routes = {
		"#problem": learnjs.problemView
	};
	var hashParts = hash.split('-');
	var viewFn = routes[hashParts[0]];
	if (viewFn) {
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