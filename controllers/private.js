exports.getPrivateData = (req,res,next) => {
    res.status(200).json({
        success: true, 
        data: "<h1>this is ez<h1/>"
    })
}