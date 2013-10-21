var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    async = require('async'),
    request = require('supertest'),
    mongoose = require('mongoose');

var Request = mongoose.model('Request');

exports = module.exports = utils = {};

utils.rmDirIfExists = function(pathToDir){
    if(fs.existsSync(pathToDir)){
        fs.rmdirSync(pathToDir);        
    }
};

utils.createRequest = function(app, data, done){
    return function(callback) {
	request(app).post('/ribosoft/requests/')
            .send(data)
            .expect(201)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    var url = res.headers.location;
		    var id = url.substring(url.lastIndexOf('/')+1);
		    id.should.have.lengthOf(4);
		    url.should.include(id);
		    callback(null, id);
		}
	    });
    };
};


utils.createInexistentRequest = function(app, data, done){
    return function(callback){
	var id = 'aaaa'; //Almost impossible to be generated
	callback(null, id);
    };
};

utils.setRequestProcessed = function(results_data, done){
    return function(id, callback){
 	async.waterfall
	([
	    function(callback){
		callback(null, {uuid: id});
	    },
	    function(query, callback){
		Request.findOne(query, callback);
	    },
	    function(result){
		result.setStatus(3);
		result.setStatus(4);
		try{
		    saveResultsUncompressed(id, JSON.stringify(results_data));
		    result.save(function(err, result){
			if(err) callback(err);
			else {
			    callback(null, id);
			}
		    });
		} catch (err){
		    done(err);
		}
	    }
	], done);
    };
};

utils.requestChecker = function(data, done){
    return function(id, callback) {
	Request.findOne({uuid: id}, function(err, result) {
	    if(err) callback(err, done);
	    else {
		data.sequence.should.equal(result.sequence);
		callback(null, done);
	    }
	});
    };
};

utils.inexistentRequestChecker = function(data, done){
    return function(id, callback) {
	Request.findOne({uuid: id}, function(err, result) {
	    if(err)
		callback(err, done);
	    else if(result){
		callback('Request was not deleted', done);
	    }
	    else {
		callback(null, done);
	    }
	});
    };
};

utils.setRequestInProcessing = function(duration, done){
    return function(id, callback) {
	Request.findOne({uuid: id}, function(err, result) {
	    if(err)
		callback(err, done);
	    else {
		result.setStatus(3);
		result.setRemainingTime(duration);
		result.save(function(err, res){
		    if(err) callback(err, done);
		    else {
			callback(null, id);
		    }
		});
	    }
	});
    };
}

utils.getRequest = function(app, data, done) {
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id)
            .expect(200)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    var request = res.body;
		    id.should.equal(request.id);
		    delete request.id;
		    request.should.eql(data);
		    callback(null, done);
		}
	    });
    }
};

utils.getRequestStatus = function(app, done){
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id+'/status')
            .expect(200)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    var url = res.headers.location;
		    url.should.include(id);
		    url.should.include('results');
		    callback(null, id);
		}
	    });    
    };
};

utils.getInProcessingRequestStatus = function(app, duration, done){
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id+'/status')
            .expect(202)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    var remainingDuration = res.body.duration;
		    remainingDuration.should.eql(duration);
		    callback(null, done);
		}
	    });    
    };
};


utils.checkResultsFileExist = function(results_data, done){
    return function(id, callback){
	try{
	    var obj = JSON.parse(loadResultsUncompressed(id));
	} catch(err){
	    callback(err);
	}
	obj.should.eql(results_data);
	callback(null, done);
    };
};

utils.getResults = function(app, results_data, done){
    return function(id, callback){
	request(app).get('/ribosoft/requests/'+id+'/results')
            .expect(200)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    res.body.results.should.eql(results_data);
		    callback(null, done);
		}
	    });
    };
};



utils.deleteRequest = function(app, data, done){
    return function(id, callback) {
	request(app).del('/ribosoft/requests/'+id)
            .expect(204)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    callback(null, id);
		}
	    });
    }
}

utils.deleteInProcessingRequest = function(app, data, done){
    return function(id, callback) {
	request(app).del('/ribosoft/requests/'+id)
            .expect(405)
            .end(function(err, res) {
		if(err)
		    callback(err, done);
		else {
		    res.body.error.should.include("request is currently being processed.");
		    callback(null, done);
		}
	    });
    }
}


utils.getInexistentRequest = function(app , data, done){
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id)
            .expect(404)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    callback(null, done);
		}
	    });
    }
}

utils.getInexistentRequestStatus = function(app , data, done){
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id+'/status')
            .expect(404)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    res.body.error.should.include('does not exist');
		    callback(null, done);
		}
	    });
    }
}


utils.deleteInexistentRequest = function(app , data, done){
    return function(id, callback) {
	request(app).get('/ribosoft/requests/'+id)
            .expect(404)
            .end(function(err, res) {
		if(err)	callback(err, done);
		else {
		    res.body.error.should.include("does not exist");
		    callback(null, done);
		}
	    });
    }
}


utils.errorHandler = function(err, done){
    if(err)
	done(err)
}

utils.clearDatabase = function(){
    console.log( 'clearDatabase TODO' );
};

utils.removeFolders = function(){
    rimraf.sync(pathToResults);
};

var pathToResults = path.join(process.cwd(), 'requests');
function saveResultsUncompressed(id, results){
    mkdirp.sync(path.join(pathToResults, id));
    fs.writeFileSync(path.join(pathToResults, id, 'requestStateUncompressed.json') , results, 'utf-8');
};

function loadResultsUncompressed(id){
    return fs.readFileSync(path.join(pathToResults, id, 'requestStateUncompressed.json'), 'utf-8'); 
};
