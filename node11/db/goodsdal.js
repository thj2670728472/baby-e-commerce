const goods = require('./mysqldb').goods;

function goodsdal() {
    this.addGoods = async function(model) {
        try {
            console.log('添加商品数据:', {
                name: model.name,
                quantity: model.quantity,
                category: model.category,
                price: model.price,
                status: model.status,
                imagesLength: model.images ? model.images.length : 0,
                description: model.description || ''
            });

            return await goods.create({
                name: model.name,
                quantity: model.quantity,
                category: model.category,
                price: model.price,
                status: model.status,
                images: JSON.stringify(model.images || []),
                description: model.description || ''
            });
        } catch (error) {
            console.error('添加商品失败:', error);
            throw error;
        }
    }

    this.getAllGoods = async function(status) {
        try {
            const where = {};
            if (status !== undefined && status !== null && status !== '') {
                where.status = status === 'true' || status === true;
            }
            const goodsList = await goods.findAll({ where, order: [['id', 'ASC']] });
            return goodsList.map(item => {
                let images = item.images || [];
                if (typeof images === 'string') {
                    try {
                        images = JSON.parse(images);
                    } catch (e) {
                        images = [];
                    }
                }
                return {
                    ...item.toJSON(),
                    images: Array.isArray(images) ? images : []
                };
            });
        } catch (error) {
            console.error('获取商品列表失败:', error);
            throw error;
        }
    }

    this.getGoodsById = async function(id) {
        try {
            const item = await goods.findOne({ where: { id: id } });
            if (item) {
                let images = item.images || [];
                if (typeof images === 'string') {
                    try {
                        images = JSON.parse(images);
                    } catch (e) {
                        images = [];
                    }
                }
                return {
                    ...item.toJSON(),
                    images: Array.isArray(images) ? images : []
                };
            }
            return null;
        } catch (error) {
            console.error('获取商品详情失败:', error);
            throw error;
        }
    }

    this.deleteGoods = async function(id) {
        try {
            return await goods.destroy({ where: { id: id } });
        } catch (error) {
            console.error('删除商品失败:', error);
            throw error;
        }
    }

    this.updateGoods = async function(model) {
        try {
            console.log('更新商品数据:', {
                id: model.id,
                name: model.name,
                quantity: model.quantity,
                category: model.category,
                price: model.price,
                status: model.status,
                imagesLength: model.images ? model.images.length : 0,
                description: model.description || ''
            });

            const updateData = {
                name: model.name,
                quantity: model.quantity,
                category: model.category,
                price: model.price,
                status: model.status
            };

            if (model.images !== undefined) {
                updateData.images = JSON.stringify(model.images || []);
            }

            if (model.description !== undefined) {
                updateData.description = model.description;
            }

            const result = await goods.update(updateData, {
                where: { id: model.id }
            });

            console.log('更新结果:', result);
            console.log('更新后的图片数量:', updateData.images ? JSON.parse(updateData.images).length : 0);
            console.log('更新后的描述值:', updateData.description || '未修改描述');

            return result;
        } catch (error) {
            console.error('更新商品失败:', error);
            throw error;
        }
    }

    this.getGoodsByCategory = async function(category) {
        try {
            return await goods.findAll({ where: { category: category } });
        } catch (error) {
            console.error('按分类获取商品失败:', error);
            throw error;
        }
    }
}

module.exports = new goodsdal();
