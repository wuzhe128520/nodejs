/**
 * Created by Administrator on 2017/3/21.
 */
const express = require('express'),
       sql = require('../module/mysql'),
       crypto = require('crypto'),
       uuidV1 = require('uuid/v1'),
       sendMail = require('../module/sendEmail'),
       router = express.Router();

//注册get请求
router.get('/',(req, res) => {
    res.render('login');
});

//注册post请求
router.post('/',(req, res) => {

    const user = req.body['name'],
           pass = req.body['pass'],
           email = req.body['email'],
           md5 = crypto.createHash('md5');

           sql('select * from user where username = ?',[user],(err,data) => {
                console.log(data);
               if(data.length < 1){
                   const uuid = uuidV1(),
                       time = new Date().toLocaleString();

                   //使用md5加密
                   var newpass = md5.update(pass).digest('hex');
                   sql('insert into user (username,password,email,code,createtime,status,admin) values (?,?,?,?,?,0,0)',[user,newpass,email,uuid,time],(err)=>{
                            if(err){
                                console.log(err);
                                res.json({
                                    status: 0,
                                    des: err
                                });
                                } else {
                                sendMail(email,'欢迎您注册无畏滴青春博客网站！点此<a style="color:red;" href="http://wuzhe128520.xicp.net:27936/register/validate/'+ uuid +'.html" >立即激活</a>您的账号。');
                                res.json({
                                    status: 1,
                                    des: '发送邮件成功！',
                                    username: user,
                                    email: email
                                });
                            }

                   });

               }
               else {
                   res.json({
                       status: 2,
                       des: '用户名已存在！'
                   });
               }
           });
});

//邮件发送成功
router.get('/sendsuccess', (req,res) => {
    var username = req.query.username,
        email = req.query.email;
    res.send('邮件发送成功，请进入邮箱'+ email +'激活账号！');
});

//激活注册
router.get('/validate/:uuid.html',(req,res) => {

    const uuid = req.params.uuid;

    sql('select id,createtime,username,email from user where code = ?',[uuid],(err, data) => {
        if(err){
            console.log(err);
        } else {
            if(data.length === 1){

                if(new Date() - data[0].createtime > 1000*60*30) {
                    //验证码过期了，重新发送
                    const uuid = uuidV1();
                    sendMail(data[0].email,'欢迎您注册无畏滴青春博客网站！点此<a style="color:red;" href="http://wuzhe128520.xicp.net:27936/register/validate/'+ uuid +'.html" >立即激活</a>您的账号。');
                    let time = new Date().toLocaleString();
                    sql('update user set createtime = ?,code=? where id=?',[time,uuid,data[0].id],(err, data) => {
                        if(err){
                            console.log(err);
                        } else {
                            res.send('验证码已经过期,已重新发送验证码，请在邮箱查收！');
                        }
                    });
                } else {
                    res.locals.data = {active: 1,username: data[0].username};
                    sql('update user set status = 1 where id = ?',[data[0].id], (err,data) => {
                        if(err){
                            console.log(err);
                        } else {
                            res.render('active');
                        }
                    });
                }
            } else {
                res.locas.active = 0;
                res.render('active');
            }
        }
    });

});

//重发验证码，需要修改数据库验证骂的时间和验证码

module.exports = router;