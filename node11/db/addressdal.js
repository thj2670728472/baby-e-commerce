const address = require('./mysqldb').address;

function addressdal() {
    this.addAddress = async function(model) {
        try {
            // 检查用户是否已有默认地址
            if (model.isDefault) {
                // 重置用户的其他默认地址
                await address.update({ isDefault: false }, { where: { userId: model.userId } });
            }
            
            return await address.create({
                userId: model.userId,
                name: model.name,
                phone: model.phone,
                province: model.province,
                city: model.city,
                district: model.district,
                detail: model.detail,
                isDefault: model.isDefault || false
            });
        } catch (error) {
            console.error('添加地址失败:', error);
            throw error;
        }
    }
    
    this.getAddressByUserId = async function(userId) {
        try {
            return await address.findAll({ where: { userId: userId }, order: [['isDefault', 'DESC']] });
        } catch (error) {
            console.error('获取用户地址失败:', error);
            throw error;
        }
    }
    
    this.getAddressById = async function(id) {
        try {
            return await address.findOne({ where: { id: id } });
        } catch (error) {
            console.error('获取地址详情失败:', error);
            throw error;
        }
    }
    
    this.updateAddress = async function(model) {
        try {
            if (model.isDefault) {
                // 重置用户的其他默认地址
                await address.update({ isDefault: false }, { where: { userId: model.userId } });
            }
            
            return await address.update(model, { where: { id: model.id } });
        } catch (error) {
            console.error('更新地址失败:', error);
            throw error;
        }
    }
    
    this.deleteAddress = async function(id) {
        try {
            return await address.destroy({ where: { id: id } });
        } catch (error) {
            console.error('删除地址失败:', error);
            throw error;
        }
    }
    
    this.getDefaultAddressByUserId = async function(userId) {
        try {
            return await address.findOne({ where: { userId: userId, isDefault: true } });
        } catch (error) {
            console.error('获取默认地址失败:', error);
            throw error;
        }
    }
}

module.exports = new addressdal();