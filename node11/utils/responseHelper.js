const responseHelper = {
    success(res, data = {}, message = '成功', code = 200) {
        res.json({
            code,
            data,
            message
        });
    },

    error(res, message = '失败', code = 400, data = {}) {
        res.json({
            code,
            data,
            message
        });
    },

    // 分页数据格式化
    paginate(res, data, total, page, limit, message = '成功') {
        res.json({
            code: 200,
            data: {
                list: data,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            },
            message
        });
    }
};


module.exports = responseHelper;