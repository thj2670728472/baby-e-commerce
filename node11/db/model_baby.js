function model_baby(db,SEQ){
    const baby=db.define('baby',{
        userId:{
            type:SEQ.INTEGER,
            allowNull:false
        },
        name:{
            type:SEQ.STRING,
            allowNull:false
        },
        birthDate:{
            type:SEQ.DATE,
            allowNull:false
        },
        gender:{
            type:SEQ.STRING,
            allowNull:false
        },
        height:{
            type:SEQ.FLOAT,
            allowNull:false
        },
        weight:{
            type:SEQ.FLOAT,
            allowNull:false
        }
    },{
        tableName:'tb_baby',
        freezeTableName:true
    });
    return baby;
}
module.exports=model_baby;