const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
    let error = {...err}; 
    error.message = error.message; 

    console.log(err.code); 

    if(err.code === 11000){
        const message = `Duplicate Field Value Enetered`; 
        error = new ErrorResponse(message, 400); 
    };
    if(err.statusCode === 401){
        const message = `Authentication Error`; 
        error = new ErrorResponse(message, 401); 
    };
    if(err.name === "ValidationError"){
        const message = Object.values(err.errors).map((val) => val.message); 
        error = new ErrorResponse(message, 400); 
    };

    res.status(error.statusCode || 500).json({
        sucess: false, 
        error: error.message || "Server Error"
    });
}

module.exports = errorHandler; 