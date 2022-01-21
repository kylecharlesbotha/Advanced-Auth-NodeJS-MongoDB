const crypto = require("crypto"); 
const User = require('../models/User'); 
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require("../utils/sendEmail");
exports.register = async (req, res, next) => {
    const {username, email, password} = req.body;
    try{
        const user = await User.create({
            username, email, password
        });
        sendToken(user, 201, res);

    }catch (error){
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const {email, password} = req.body; 

    if (!email || !password){
        return next(new ErrorResponse("Authentication failed", 400)); 
    };

    try{
        const user = await User.findOne({email}).select("+password");
        console.log("from login: " + user.password);

        if (!user){
            return next(new ErrorResponse("Authentication failed", 401)); 
        }
        const isMatch = await user.matchPasswords(password); 

        if (!isMatch){
            return next(new ErrorResponse("Authentication failed", 401)); 
        }
        sendToken(user, 200, res);


    }catch(error){
        next(error);
    };
};

exports.forgotpassword = async (req, res, next) => {
    const {email} = req.body; 

    try{
        const user = await User.findOne({email}); 
        if (!user){
            return next(new ErrorResponse("Email Error",404)); 
        };
        const resetToken = user.getResetPasswordToken(); 
        await user.save();

        const resetUrl = `http:localhost:${process.env.FRONTEND_PORT}/passwordreset/${resetToken}`;

        const message = `
        <h1>Password Reset Link</h1>
        <a href=${resetUrl} clicktracking=off>${resetUrl}></a>
        `; 

        try{
            await sendEmail({
                to: user.email, 
                subject: "Password Reset Request", 
                text: message
            });
            res.status(200).json({success: true, data: "Email sent."});
        }catch(error){
            user.resetPasswordToken = undefined; 
            user.resetPasswordExpire = undefined; 
            await user.save(); 
            return next(new ErrorResponse("Email Error",500));
        }
    }catch(error){
        return next(error);
    }
};

exports.resetpassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex"); 
    try{
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()}
        }); 

        if (!user){
            return next(new ErrorResponse("Invalid password reset token", 400)); 
        };
        user.password = req.body.password; 
        user.resetPasswordToken = undefined; 
        user.resetPasswordExpire = undefined; 
        await user.save(); 
        res.status(201).json({success: true, data: "Password has been reset succesfully."})
    }catch(error){
        next(error);
    }
};

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken();
    res.status(statusCode).json({success: true, token});
}