const authlogin=(req,res,next)=>{
    const whitelist=['/login','/public','/stylesheets'];
    if(whitelist.some(path=>req.path.startsWith(path))){
        
        next();

    }
    else{

        if((req.session)&&(req.session.user)){
            next();

        }
        else{
            res.redirect('/login');
        }
    }

}
module.exports=authlogin;