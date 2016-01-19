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
learnjs.applyObject = function(obj, $el) {
  for (var key in obj) {
    $el.find('[data-name="' + key + '"]').text(obj[key]);
  }
}
learnjs.problemView = function(problemNumber) {
	var view = $('.templates .problem-view').clone();
    view.find('.title').text('Problem #'+problemNumber+' Coming Soon!');
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