//Can generate up to 1.3 Million unique ids
function generateUID() {
   return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
}

function fromObjectToArrayString(obj){
    return function(){
        var arr = new Array();
        for(var i = 0, l = obj.length; i<l; ++i){
            arr.push(obj[i]);
        }
        return arr;
    }();
}

function fromObjectToArrayStringUpper(obj){
    return function(){
        var arr = new Array();
        for(var i = 0, l = obj.length; i<l; ++i){
            console.log("obj[i].toUpper "+obj[i].toUpperCase());
            arr.push(obj[i].toUpperCase());
        }
        return arr;
    }();
}

function getExpirationDelay(){
    //Currently set to a week
    return 7;
}

var renderInputError = function(clientMessage, next) {
    renderError(clientMessage, "This should have been handled on client side", next);
};

var renderDatabaseError = function(clientMessage, next) {
    renderError(clientMessage, "Something went wrong when interacting with the database", next);
};

var renderInternalError = function(clientMessage, next) {
    renderError(clientMessage, "Something went wrong on the server.", next);
};

var renderError = function(clientMessage, consoleMessage, next) {
    next({errorMessage: clientMessage});
};

var onSaveHandler = function(successCallback, next) {
    return function(err, result){
        if (err)
        {
            renderDatabaseError("Could not update process request", next);
        }
        else{
            successCallback(result);
        }
    };
};

exports.SECONDS_IN_WEEK = 604800;
exports.generateUID = generateUID;
exports.getExpirationDelay = getExpirationDelay;
exports.objectToArrayString = fromObjectToArrayString;
exports.objectToArrayStringUpper = fromObjectToArrayStringUpper;
exports.renderInputError = renderInputError;
exports.renderDatabaseError = renderDatabaseError;
exports.renderInternalError = renderInternalError;
exports.onSaveHandler = onSaveHandler;