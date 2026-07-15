const user=require('./mysqldb').user;

function userdal(){
    this.addUser=async function(model) {
        return await user.create({
            username: model.username,
            password: model.password,
            phone: model.phone || '',
            email: model.email || '',
            isactive: model.isactive || true
        });
    }
    this.getAllUser=async function() {
        return await user.findAll();
    }
    this.login=async function(model) {
        return await user.findOne({where:{username:model.username,password:model.password}});
    }
    
    this.getUserByUsername=async function(username) {
        return await user.findOne({where:{username:username}});
    }
    this.getUserById=async function(id) {
        return await user.findOne({where:{id:id}});
    }
    this.deleteUser=async function(id) {
        return await user.destroy({where:{id:id}});
    }
    this.updateUser=async function(model) {
        return await user.update(model,{where:{id:model.id}});
    }
    
    this.changePassword=async function(model) {
        // 先验证旧密码是否正确
        const userInfo = await user.findOne({
            where: {
                username: model.username,
                password: model.oldPassword
            }
        });
        
        if (userInfo) {
            // 更新密码
            const result = await user.update(
                { password: model.newPassword },
                { where: { id: userInfo.id } }
            );
            // 返回更新结果，包含受影响的行数
            return { success: true, affectedRows: result[0] };
        }
        return null;
    }
  
}
module.exports=new userdal();