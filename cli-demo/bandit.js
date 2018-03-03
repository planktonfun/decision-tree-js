var Bandit = function(callback, payload) {
	this.callback = callback;
	this.payload = payload;
	this.score = 33;
	this.tries = 0;
	this.initialTries = 100;
	this.totalScore = 0;
	this.execute = function() {
		this.score = 0;
		this.score = this.callback(this.tries, this.payload);
		this.totalScore += this.score;
	};

	this.setTrial = function(tries) {
		this.tries = tries;
		this.initialTries = tries;
	}

	this.getScore = function() {
		var score = Math.floor(this.score/this.initialTries*100);

		if(score < 10) {
			score = 10;
			this.score = Math.round(this.initialTries*0.1);
		}

		if(this.score == 0) {
			this.score = 10;
		}

		return score;
	}
}

module.exports = Bandit;