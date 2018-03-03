var BanditManager = function(config) {
	this.numberOfGroupTest    = config.numberOfGroupTest;
	this.testCountForEachStep = config.testCountForEachStep;
	this.sum                  = config.sum;
	this.arms = [];
	this.addArm = function(bandit) {
		this.arms.push(bandit);
	}

	this.execute = function() {
		for (var i = this.arms.length - 1; i >= 0; i--) {
			this.arms[i].initialTries = this.testCountForEachStep;
			this.arms[i].score = this.testCountForEachStep/this.arms.length;
		}

		for (var b = 0; b < this.numberOfGroupTest; b++) {
			console.log('---');
			for (var i = this.arms.length - 1; i >= 0; i--) {
				var share = Math.floor(this.testCountForEachStep*this.arms[i].getScore()/this.sum);
				console.log(share, i, this.arms[i].getScore()/this.sum);

				this.arms[i].setTrial(share);
			}
			console.log('---');

			for (var i = this.arms.length - 1; i >= 0; i--) {
				this.arms[i].execute();
			}

			this.sum = 0;

			for (var i = this.arms.length - 1; i >= 0; i--) {
				this.sum += this.arms[i].getScore();

				console.log(this.arms[i].totalScore, this.arms[i].getScore() + '%', i);
			}

			console.log('---');

			for (var i = this.arms.length - 1; i >= 0; i--) {
				console.log(this.arms[i].totalScore, Math.floor((this.arms[i].getScore()/this.sum*100)) + '%', i);
			}
		}
	}
}

module.exports = BanditManager;