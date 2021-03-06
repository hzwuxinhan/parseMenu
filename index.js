'use strict';

var argv = require('yargs').argv,
    http = require('http'),
    schedule = require('node-schedule'),
    fs = require('fs');

var utils = require('shark-utils');

var target = argv.target;
var type;

if(target == "online") {
    var users = ['hzwuxinhan','hzwuhaowei','hzzhouming','hzgaozepan','hzwangying1','hzliangyuekang','hzzhoulong','wuzifang','hzgaomiaomiao','hzdingxinghua','hzjinbing','hzyangbo15','hzlingqiao','hzyuhuibin','hzzhanghao2015'];
}else {
    var users = ['hzwuxinhan']
}

function parseMenus(typeNum){
    type = typeNum;
    var options = {
        hostname: 'crystalpot.cn',
        port: 80,
        path: '/menus/0',
        method: 'GET'
    };
    httpRequest(options);
}

function parseHtml(html) {

    html = html.replace(/<[^>]+>/g,"");
    if(type == 2) {
        html = html.replace(/(.|\n|\r)*餐厅晚餐/g,'');
        html = html.replace(/网易餐厅夜宵(.|\n|\r)*/,"");
        var name = "晚餐";
    }else{
        html = html.replace(/(.|\n|\r)*餐厅中餐/g,'');
        html = html.replace(/网易餐厅晚餐(.|\n|\r)*/,"");
        var name = "午餐";
    }

    
    html = html.replace(/&nbsp;/g,"");
    html = html.replace(/【/g,"\n【");
    html = html.replace(/1F/g,"\n1F");
    html = html.replace(/2F/g,"\n2F");

    utils.PoPo.send_to_users(users,'小伙伴们吃饭啦！！'+name+'菜单:'+html)
}

function httpRequest(options) {
    var req = http.request(options, function(res) {
        var html = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            html += chunk;
        });
        res.on('end', function() {
            parseHtml(html); // 对html做解析处理
        });
    });

    req.on('error', function(e) {
        console.log(('请求失败: ' + e.message).red);
    });

    // write data to request body
    req.write('data\n');
    req.write('data\n');
    req.end();
}

var ruleOne = new schedule.RecurrenceRule();
ruleOne.dayOfWeek = [1,2,3,4,5];
ruleOne.hour = 11;
ruleOne.minute = 30;

var ruleTwo = new schedule.RecurrenceRule();
ruleTwo.dayOfWeek = [1,2,3,4,5];
ruleTwo.hour = 17;
ruleTwo.minute = 30;

var j = schedule.scheduleJob(ruleOne, function(){
  parseMenus(1)
});

var i = schedule.scheduleJob(ruleTwo, function(){
  parseMenus(2)
});

