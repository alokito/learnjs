describe("LearnJS", function() {
	it("can show a problem view", function(){
		learnjs.showView("#problem-1");
		expect($('.view-container .problem-view').length).toEqual(1);
	});
	it("shows the landing page when there is no hash", function(){
		learnjs.showView("");
		expect($('.view-container .landing-view').length).toEqual(1);
	});
	it('passes the hash view parameter to the view function', function() {
		spyOn(learnjs, 'problemView');
		learnjs.showView("#problem-42");
		expect(learnjs.problemView).toHaveBeenCalledWith('42');
	});
	describe('problem view', function(){
		it('has a title that includes the problem number', function(){
			var view = learnjs.problemView('1');
			expect(view.find('.title').text()).toEqual('Problem #1');
		});
    it('has a paragraph that includes the problem description', function(){
      var view = learnjs.problemView('1');
      expect(view.find('p').text()).toEqual(learnjs.problems[0].description);
    });
    it('has a code that includes the problem code', function(){
      var view = learnjs.problemView('1');
      expect(view.find('code').text()).toEqual(learnjs.problems[0].code);
    });
    describe('answer section', function() {
      it('can check a correct answer by hitting a button', function() {
        var view = learnjs.problemView('1');
        view.find('.answer').val('true');
        view.find('.check-btn').click();
        expect(view.find('.result').text()).toContain('Correct!');
      });
      it('rejects an incorrect answer', function() {
        var view = learnjs.problemView('1');
        view.find('.answer').val('false');
        view.find('.check-btn').click();
        expect(view.find('.result').text()).toEqual('Incorrect!');
      });
    });
  });
	it('invokes the router when loaded', function(){
		spyOn(learnjs, 'showView');
		learnjs.appOnReady();
		expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
	});
	it('subscribes to the hash change event', function(){
		learnjs.appOnReady();
		spyOn(learnjs, 'showView');
		$(window).trigger('hashchange');
		expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
	});
  describe('buildCorrectFlash', function(){
    it('returns a link to the next problem', function(){
      var correct = learnjs.buildCorrectFlash(0);
      expect(correct.find('a').attr('href')).toEqual('#problem-1');
    });
    it('wraps to beginning', function(){
      var correct = learnjs.buildCorrectFlash(learnjs.problems.length-1);
      expect(correct.find('a').attr('href')).toEqual('');
    });
  });
});