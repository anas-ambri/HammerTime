var mongoose = require('mongoose')
    path = require('path');
var Schema = mongoose.Schema;

/************************ Request Schema *****************/
var Request = new Schema({
    uuid : String,
    createDate : {type: Date, default: Date.now },
    //Status is an integer that represents the state of the request
    // 1 : Created
    // 2 : Ready for processing
    // 3 : In-Processing
    // 4 : Processed
    // 5 : Notified
    status : { type: Number, min: 1, max: 5, default:1 },
    state : {type : String, default:'\n'},
    sequence : {type: String, trim: true },
    accessionNumber : {type: String, default: '', trim : true},
    foldShape : String,
    emailUser : {type: String, default: '', trim : true},
    tempEnv : {type: Number, default: 37},
    naEnv: {type: Number, default: 0},
    mgEnv: {type: Number, default: 0},
    oligoEnv: {type: Number, default: 0},
    cutsites: [String],
    left_arm_min : {type: Number, default: 3},
    right_arm_min : {type: Number, default: 3},
    left_arm_max : {type: Number, default: 8},
    right_arm_max : {type: Number, default: 8},
    targetRegion : { type: Number, min: 3, max: 5, default:4 },
    //targetEnv = false for vitro, true for vivo
    targetEnv : Boolean,
    vivoEnv : {type: String, default:""},
    remainingDuration: {type: Number, default:120},
    resultPath : String
});

Request.statics = {
    createRequest : function (id,
			      seq,
			      accessionNumber,
			      foldShape,
			      tempEnv,
			      naEnv,
			      mgEnv,
			      oligoEnv,
			      cutsites,
			      targetRegion,
			      targetEnv,
			      vivoEnv,
			     left_arm_min,
			     right_arm_min,
			     left_arm_max,
			     right_arm_max,
			     emailUser){
	return new this({
            uuid : id,
            status : 2,
            sequence: seq,
            accessionNumber : accessionNumber,
	    foldShape : foldShape,
	    tempEnv: tempEnv,
	    naEnv: naEnv,
	    mgEnv: mgEnv,
	    oligoEnv: oligoEnv,
	    cutsites: cutsites,
	    left_arm_min : left_arm_min,
	    right_arm_min : right_arm_min,
	    left_arm_max : left_arm_max,
	    right_arm_max : right_arm_max,
	    targetRegion: targetRegion,
	    targetEnv: targetEnv,
	    vivoEnv: vivoEnv,
	    resultPath: path.join(process.cwd(), id, 'requestStateUncompressed.json'),
	    emailUser: emailUser
	});
    },
    flushOutdatedRequests : function(){
	var weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - config.expirationDelay);
	this.find({createDate:{"$lte":weekAgo}}, function(err, result, count){
            if(err)
		console.log("Could not find old requests");
            else if(!result)
		console.log("No request to flush");
            else {
		result.forEach(function(element){
                    element.remove(function(err, result){
			if(err)
                            console.log("Could not delete request");
                    }); 
		});
		console.log("Database flushed for "+count+" old requests.");
            }
	});
    }
};

Request.methods = {
    getEnv : function(){
	if (this.targetEnv)
	    return {type: this.getTargetEnv(), target: this.vivoEnv};
	else
	    return {type: this.getTargetEnv(), target: ''};
    },
    getTargetEnv : function(){
	return (this.targetEnv)? 'vivo':'vitro';
    },
    getRegion : function(){
	return (this.targetRegion === 4)? 'ORF':
            (this.targetRegion === 5)?'5\'':'3\'';
    },
    setStatus : function(newStatus){
	//status is always between 1 and 5, and is always incremented by 1
	if( newStatus > 5 || newStatus< 1 || newStatus - 1 !== this.status) {
            return false;
	}
	
	this.status = newStatus;
	return true;
    },
    getDetailedStatus : function(){
	switch(this.status){
	case 1:
	default:
	    return "Created";
	case 2:
	    return "Ready for processing";
	case 3:
	    return "In-Processing";
	case 4:
	case 5:
	    return "Processed";
	}
    },
    getState : function(){
	return this.state;
    },
    getRemainingTime : function(unit){
	if(this.getDetailedStatus() == "Processed")
	    return {remainingDuration: 0, unit: 'min'};
	switch(unit){
	case 'min':
	default:
	    return {remainingDuration: this.remainingDuration, unit: 'min'};
	case 'h':
	    return {remainingDuration: this.remainingDuration/60, unit: 'h'};
	}
    },
    setRemainingTime : function(duration){
	switch(duration.unit){
	case 'min':
	default:
	    this.remainingDuration = duration.remainingDuration;
	    break;
	case 'h':
	    this.remainingDuration = duration.remainingDuration * 60;
	    break;
	}	    
    }
};

mongoose.model( 'Request', Request );