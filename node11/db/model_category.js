function model_category(db,SEQ){
    const category=db.define('category',{
        name:{
            type:SEQ.STRING,
            allowNull:false
        },
        sort:{
            type:SEQ.INTEGER,
            allowNull:false,
            defaultValue:0
        },
        status:{
            type:SEQ.BOOLEAN,
            allowNull:false,
            defaultValue:true
        }
    },{
        tableName:'tb_category',
        freezeTableName:true
    });
    return category;
}
module.exports=model_category;