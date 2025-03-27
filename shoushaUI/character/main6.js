app.import(function (lib, game, ui, get, ai, _status, app) {

window.nimade = {       
        name: "十周年UI",
        url: lib.assetURL + "extension/十周年UI",

        SS_ZNQ_wenyang:{
            name: "../../../十周年UI/shoushaUI/character/images/decade/SS_ZNQ_wenyang"
        },
        SS_DaTing_zhounianqing_beijingyanhua:{
        name: "../../../十周年UI/shoushaUI/character/images/decade/SS_DaTing_zhounianqing_beijingyanhua",
        },

        
        };
        
  var plugin = {
    name: 'character',
    filter: function () {
      return !['chess', 'tafang', 'stone', 'connect'].contains(get.mode());
    },
    content: function (next) {
      app.waitAllFunction([
        function (next) {

          next();
        },

        function (next) {
          lib.init.css(lib.assetURL + 'extension/' + app.name + '/' + plugin.name, 'main2', next);
        },
      ], next);
    },
    precontent: function () {
      app.reWriteFunction(lib, {
        setIntro: [function (args, node) {
          if (get.itemtype(node) === 'player') {
            if (lib.config.touchscreen) {
              lib.setLongPress(node, plugin.click.playerIntro);
            } else {
              if (lib.config.right_info) {
                node.oncontextmenu = plugin.click.playerIntro;
              }
            }
            return node;
          }
        }],
      });


    },

    click: {
      identity: function (e) {
        e.stopPropagation();
        var player = this.parentNode;
        if (!game.getIdentityList) return;
        if (player.node.guessDialog) {
          player.node.guessDialog.classList.toggle('hidden');
        } else {
          var list = game.getIdentityList(player);
          if (!list) return;
          var guessDialog = ui.create.div('.guessDialog', player);
          var container = ui.create.div(guessDialog);

          lib.setScroll(guessDialog);
          player.node.guessDialog = guessDialog;
        }
      },
      playerIntro: function (e) {
        e.stopPropagation();

        if (plugin.playerDialog) {
          return plugin.playerDialog.show(this);
        }

        var container = ui.create.div('.popup-container.hidden', ui.window, function (e) {
          if (e.target === container) {
            container.hide();
            game.resume2();
          }
        });
        var dialog = ui.create.div('.character-dialog.popped', container);
        var leftPane = ui.create.div('.left', dialog);
        var rightPane = ui.create.div('.right', dialog);
        
        var xing = ui.create.div('.xing', dialog);
        var biankuangname = ui.create.div('.biankuangname', dialog);
        var mingcheng = ui.create.div('.mingcheng', dialog);


        var dengji = ui.create.div('.dengji', dialog);

        


        var createButton = function (name, parent) {
          if (!name) return;
          if (!lib.character[name]) return;
          var button = ui.create.button(name, 'character', parent, true);
        };

        container.show = function (player) {
          
          
          var caizhu = ui.create.div('.caizhu',dialog);
         // caizhu.appendChild(caizhu);
      /*    caizhu.onclick = function () {
          var popuperContainer = ui.create.div('.popup-container', ui.window);
          game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');       
         // if (lib.config.mode == 'doudizhu') {
            
              ui.create.div('.lilapdizhu', popuperContainer);
              ui.create.div('.lilapdizhu2', popuperContainer);          
              
              
          
          popuperContainer.addEventListener('click', event => {
            game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3');
            popuperContainer.delete(200);
          });
        };
          */
          var shanchang = get.config('recentCharacter');
          if (lib.config.extension_十周年UI_ZLLT == true) {
            var leftPane = ui.create.div('.left', dialog);
          } else { var leftPane = ui.create.div('.left2', dialog); }

          leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
         // createButton(name, leftPane.firstChild);
         // createButton(name2, leftPane.firstChild);
          //dialog.classList.add('single');

          caizhu.onclick = function () {
            var popuperContainer = ui.create.div('.popup-container', { background: "rgb(0,0,0,0)" }, ui.window);
            game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');       
            
            setTimeout(function(){
                game.playAudio('../extension/十周年UI/shoushaUI/character/images/decade/SS_ZNQ_wenyang.mp3');
            },2000)
            
          /*  popuperContainer.addEventListener('click', event => {
            game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3');
              event.stopPropagation();
              popuperContainer.delete(200);
            });*/
            var bigdialog = ui.create.div('.bigdialog', popuperContainer);
            
            dcdAnim.loadSpine(nimade.SS_ZNQ_wenyang.name, "skel", function () {
    // 特效，动画仅播放一次
    dcdAnim.playSpine(nimade.SS_ZNQ_wenyang, { speed: 1, scale: 1.0, x: [0,0.5], y: [0, 0.7], parent: bigdialog });
});
            

            var kuangkuang1 = ui.create.div('.kuangkuang1', bigdialog);
            var kuangkuang2 = ui.create.div('.kuangkuang2', bigdialog);
            var kuangkuang3 = ui.create.div('.kuangkuang3', bigdialog);
            var kuangkuang4 = ui.create.div('.kuangkuang4', bigdialog);

            var shanchang1 = ui.create.div('.shanchang1', bigdialog);
            var shanchang2 = ui.create.div('.shanchang2', bigdialog);
            var shanchang3 = ui.create.div('.shanchang3', bigdialog);
            var shanchang4 = ui.create.div('.shanchang4', bigdialog);
            var minixingxiang = ui.create.div('.minixingxiang', bigdialog);
            var jingji = ui.create.div('.jingji', bigdialog);
            var xingbie = ui.create.div('.xingbie', bigdialog);
            var useless = ui.create.div('.useless', bigdialog);
            var useless2 = ui.create.div('.useless2', bigdialog);
            var wanjiaming = ui.create.div('.wanjiaming', bigdialog, player === game.me ? lib.config.connect_nickname : get.translation(innerText = num = ["氪金抽66", "卡宝真可爱", "蒸蒸日上", "√卡视我如父", "麒麟弓免疫枸杞", "坏可宣（老坏批）", "六千大败而归",
              "开局酒古锭", "遇事不决刷个乐", "见面两刀喜相逢", "改名出66", "时代的六万五", "韩旭", "司马长衫", "ogx",
              "狗卡不如无名杀", "王八万", "一拳兀突骨", "开局送神将", "丈八二桃", "装甲车车", "等我喝口酒", "Samuri", "马",
              "Log-Frunki", "aoe银钱豹", "没有丈八就托管", "无中yyds", "给咸鱼鸽鸽打call", "小零二哟～", "长歌最帅了",
              "大猫有侠者之风", "布灵布灵❤️", "我爱～摸鱼🐠～", "小寻寻真棒", "呲牙哥超爱笑", "是俺杀哒", "阿七阿七",
              "祖安·灰晖是龙王", "吃颗桃桃好遗计", "好可宣✓良民", "藏海表锅好", "金乎？木乎？水乎！！", "无法也无天", "西风不识相",
              "神秘喵酱", "星城在干嘛？", "子鱼今天摸鱼了吗？", "阳光苞里有阳光", "诗笺的小裙裙", "轮回中的消逝", "乱踢jb的云野",
              "小一是不是...是不是...", "美羊羊爱瑟瑟", "化梦的星辰", "杰哥带你登dua郎", "世中君子人", "叹年华未央", "短咕咕",
              "洛天依？！", "黄老板是好人～", "来点瑟瑟文和", "鲨鱼配辣椒", "萝卜～好萝卜", "废城君", "E佬细节鬼才",
              "感到棘手要怀念谁？", "半价小薯片", "JK欧拉欧拉欧拉", "新年快乐", "乔姐带你飞", "12345678？", "缘之空", "小小恐龙", "教主：杀我！", "才思泉涌的司马", "我是好人", "喜怒无常的大宝", "黄赌毒", "阴间杀～秋", "敢于劈瓜的关羽", "暮暮子"].randomGet(1)));
            var gonghui = ui.create.div('.gonghui', bigdialog, get.translation(innerText = '(' + (num = ['无名杀会员', '手机三国杀会员', '三国杀ol会员', '三国杀十周年会员', '怒焰三国杀会员', '欢乐三国杀会员', '阵面对决会员']).randomGet(1) + ')'));
            var xianhua = ui.create.div('.xianhua', bigdialog, get.translation(innerText = '🌹鲜花' + (num = Math.floor(Math.random() * (999 - 1 + 1) + 1))));
            var jidan = ui.create.div('.jidan', bigdialog, get.translation(innerText = '🥚鸡蛋' + (num = Math.floor(Math.random() * (999 - 1 + 1) + 1))));
            var fenxiang = ui.create.div('.fenxiang', bigdialog, get.translation(innerText = '分享'));
            fenxiang.onclick = function () {    
    fenxiang.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        fenxiang.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒
    //useless
    useless.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        useless.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒
    
      setTimeout(function(){
     //   game.playAudio('../extension/十周年UI/shoushaUI/character/SS_ZNQ_wenyang.mp3');
    }, 2000);   
    game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');
    dcdAnim.loadSpine(nimade.SS_DaTing_zhounianqing_beijingyanhua.name, "skel", function () {
        // 特效，动画仅播放一次
        dcdAnim.playSpine(nimade.SS_DaTing_zhounianqing_beijingyanhua, { speed: 1, scale: 0.95, parent: bigdialog });
    });
};
            
            var zhanshi = ui.create.div('.zhanshi', bigdialog, get.translation(innerText = '展示(诏令－1)'));
            zhanshi.onclick = function () {    
    zhanshi.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        zhanshi.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒
    //useless2
    useless2.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        useless2.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒
    
      setTimeout(function(){
        game.playAudio('../extension/十周年UI/shoushaUI/character/images/decade/SS_ZNQ_wenyang.mp3');
    }, 2000);   
    game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');
    dcdAnim.loadSpine(nimade.SS_ZNQ_wenyang.name, "skel", function () {
        // 特效，动画仅播放一次
        dcdAnim.playSpine(nimade.SS_ZNQ_wenyang, { speed: 1, scale: 1.0, x: [0,0.5], y: [0, 0.7], parent: bigdialog });
    });
};
            
            var zasui = ui.create.div('.zasui', bigdialog, get.translation(innerText = '   '));
            
            var haoyou = ui.create.div('.haoyou', bigdialog, get.translation(innerText = '   '));
            haoyou.onclick = function () {    
    haoyou.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        haoyou.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒    
    game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');
    
    var zhubajie = ['猪八戒1', '猪八戒2'];    
    game.playAudio('../extension/十周年UI/shoushaUI/character/images/decade/' + zhubajie.randomGet() + '.mp3');
        
};
            
            
            var haoyou2 = ui.create.div('.haoyou2', bigdialog, get.translation(innerText = '   '));
            var haoyou3 = ui.create.div('.haoyou3', bigdialog, get.translation(innerText = '   '));
            // 为haoyou3元素添加点击事件监听器，点击时关闭页面
    haoyou3.addEventListener('click', function(event) {
        game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3'); // 可选：播放关闭时的音频
        popuperContainer.delete(200); // 关闭页面或删除对话框容器
        event.stopPropagation(); // 阻止事件冒泡到父元素
    });

            
            
            var zhaoshiliuyan = ui.create.div('.zhaoshiliuyan', bigdialog, get.translation(innerText = num = ["氪金抽66", "卡宝真可爱", "蒸蒸日上", "√卡视我如父", "麒麟弓免疫枸杞", "坏可宣（老坏批）", "六千大败而归",
              "开局酒古锭", "遇事不决刷个乐", "见面两刀喜相逢", "改名出66", "时代的六万五", "韩旭", "司马长衫", "ogx",
              "狗卡不如无名杀", "王八万", "一拳兀突骨", "开局送神将", "丈八二桃", "装甲车车", "等我喝口酒", "Samuri", "马",
              "Log-Frunki", "aoe银钱豹", "没有丈八就托管", "无中yyds", "给咸鱼鸽鸽打call", "小零二哟～", "长歌最帅了",
              "大猫有侠者之风", "布灵布灵❤️", "我爱～摸鱼🐠～", "小寻寻真棒", "呲牙哥超爱笑", "是俺杀哒", "阿七阿七",
              "祖安·灰晖是龙王", "吃颗桃桃好遗计", "好可宣✓良民", "藏海表锅好", "金乎？木乎？水乎！！", "无法也无天", "西风不识相",
              "神秘喵酱", "星城在干嘛？", "子鱼今天摸鱼了吗？", "阳光苞里有阳光", "诗笺的小裙裙", "轮回中的消逝", "乱踢jb的云野",
              "小一是不是...是不是...", "美羊羊爱瑟瑟", "化梦的星辰", "杰哥带你登dua郎", "世中君子人", "叹年华未央", "短咕咕",
              "洛天依？！", "黄老板是好人～", "来点瑟瑟文和", "鲨鱼配辣椒", "萝卜～好萝卜", "废城君", "E佬细节鬼才",
              "感到棘手要怀念谁？", "半价小薯片", "JK欧拉欧拉欧拉", "新年快乐", "乔姐带你飞", "12345678？", "缘之空", "小小恐龙", "教主：杀我！", "才思泉涌的司马", "我是好人", "喜怒无常的大宝", "黄赌毒", "阴间杀～秋", "敢于劈瓜的关羽", "暮暮子"].randomGet(1)));



            //var shanchang = get.config('recentCharacter');
            var shanchang = ["bailingyun", "baosanniang", "beimihu", "bianyue", "caizhenji", "caohua", "caojinyu", "caoxian", "caoxiancaohua", "caoyi", "caoying", "clan_xuncai", 'clan_zhongyan', 'mb_guozhao', 'dc_yuezhoufei', 'dongwan', 'dongxie', 'duanqiaoxiao', 'dufuren', 'luyi', 'luyusheng', 'lvlingqi', 'ol_caifuren', 'ol_bianfuren', 'ol_dingshangwan', 'ol_wangyi', 'ol_zhangchunhua', 'quanhuijie', 'sb_xiahoushi', 'sb_sunshangxiang', 'sb_zhenji', 'sb_zhurong', 'shen_caocao', 'shen_caopi', 'shen_dengai', 'shen_dianwei', 'shen_diaochan', "shen_ganning", "shen_guanyu", "shen_guojia", "shen_huatuo", "shen_jiangwei", "shen_liubei", "shen_lusu", "shen_luxun", "shen_lvbu", "shen_lvmeng", "shen_machao", "shen_simayi", "shen_sunce", "shen_sunquan", "shen_taishici", "shen_zhangfei", "shen_xunyu", "shen_zhangjiao", "shen_zhangliao", "shen_zhaoyun", "shen_zhenji", "shen_zhouyu", "shen_zhugeliang", "wu_guanyu", "wu_luxun","wu_zhugeliang"];
            haoyou2.onclick = function () {
            game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');
            haoyou2.style.transform = 'scale(0.9)'; // 按钮缩小
    setTimeout(() => {
        haoyou2.style.transform = 'scale(1)'; // 按钮恢复原状
    }, 100); // 反馈效果持续时间100毫秒                
            shanchang1.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang2.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang3.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang4.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            };
            shanchang1.onclick = function () {           
            shanchang1.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            };
            shanchang2.onclick = function () {           
            shanchang2.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            };
            shanchang3.onclick = function () {           
            shanchang3.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            };
            shanchang4.onclick = function () {           
            shanchang4.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            };
            
            
            var jingjitu = ['jingji1', 'jingji2', 'jingji3', 'jingji4'];
            
            jingji.onclick = function () {
            game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3');
            jingji.setBackgroundImage('extension/十周年UI/shoushaUI/character/images/decade/' + jingjitu.randomGet() + '.png');
            };
            
            var xingbietu = ['xingbie1', 'xingbie2'];

            shanchang1.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang2.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang3.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            shanchang4.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
            useless.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/decade/useless.png");
            useless2.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/decade/useless2.png");
            minixingxiang.style.backgroundImage = player.node.avatar.style.backgroundImage;
            jingji.setBackgroundImage('extension/十周年UI/shoushaUI/character/images/decade/' + jingjitu.randomGet() + '.png');
            xingbie.setBackgroundImage('extension/十周年UI/shoushaUI/character/images/decade/' + xingbietu.randomGet() + '.png');
          }
          
          
          
          //通过势力判断技能框的背景颜色
          var extensionPath = lib.assetURL + 'extension/十周年UI/shoushaUI/';
          var group = player.group;
          if (group != 'wei' && group != 'shu' && group != 'wu' && group != 'qun' && group != 'ye'
            && group != 'jin' && group != 'daqin' && group != 'western' && group != 'shen' && group != 'key'&& group != 'Han'&& group != 'qin')
            group = 'default';
          var url = extensionPath + 'character/images/decade/skt_' + group + '.png';
          dialog.style.backgroundImage = 'url("' + url + '")';
          var skin1 = ui.create.div('.skin1', dialog);
          var skin2 = ui.create.div('.skin2', dialog);

          //判断是否隐藏，以及获取主副将的姓名
          var name = player.name1 || player.name;
          var name2 = player.name2;
          if (player.classList.contains('unseen') && player !== game.me) {
            name = 'unknown';
          }
          if (player.classList.contains('unseen2') && player !== game.me) {
            name2 = 'unknown';
          }

          //主将立绘
          var playerSkin;
          if(name != 'unknown'){
            playerSkin = player.style.backgroundImage;
            if (!playerSkin) playerSkin = player.childNodes[0].style.backgroundImage;
            skin1.style.backgroundImage = playerSkin;
          }
          else {
            var url = extensionPath + 'character/images/decade/unknown.png';
            skin1.style.backgroundImage = 'url("' + url + '")';
          }
          //副将立绘
          if (name2) {
            var playerSkin2;
            if (name2 != 'unknown') {
              playerSkin2 = player.childNodes[1].style.backgroundImage;
              skin2.style.backgroundImage = playerSkin2;
            }
            else {
              var url = extensionPath + 'character/images/decade/unknown.png';
              skin2.style.backgroundImage = 'url("' + url + '")';
            }
          }

          //等阶。适配最新版千幻
          var rarity = game.getRarity(name);
          if(!rarity) rarity = 'junk';
          var pe = ui.create.div('.pe1',dialog);
          var url;
          if(lib.config['extension_千幻聆音_enable']){
            var temp;
            switch(game.qhly_getSkinLevel(name,game.qhly_getSkin(name),true,false)){
              case 'xiyou': temp='rare';break;
              case 'shishi': temp='epic';break;
              case 'chuanshuo': temp='legend';break;
              case 'putong': temp='common';break;
              case 'dongtai': temp='legend';break;
              case 'jueban': temp='unique';break;
              case 'xianding': temp='restrictive';break;
              default: temp='junk';
            }
            url = extensionPath + 'character/images/decade/pe_' + temp + '.png';
          }
          else url = extensionPath + 'character/images/decade/pe_' + rarity + '.png';
          pe.style.backgroundImage = 'url("' + url + '")';
          var value;
          if(lib.config['extension_千幻聆音_enable']){
            value = game.qhly_getSkin(name);
            if (value) value = value.substring(0, value.lastIndexOf('.'));
            else value = '经典形象';
          }
          else value='经典形象';
          var pn= ui.create.div('.pn1',value+'*'+get.translation(name));
          pe.appendChild(pn);

          //武将姓名
          var nametext='';
          if(name && name2){
            if(name == 'unknown') nametext+='未知';
            else if(lib.translate[name + '_ab']) nametext+=lib.translate[name + '_ab'];
            else nametext+=get.translation(name);
            nametext+=' / ';
            if(name2 == 'unknown') nametext+='未知';
            else if(lib.translate[name2 + '_ab']) nametext+=lib.translate[name2 + '_ab'];
            else nametext+=get.translation(name2);
          }
          else{
            if(name == 'unknown') nametext+='未知';
            else if(lib.translate[name + '_ab']) nametext+=lib.translate[name + '_ab'];
            else nametext+=get.translation(name);
          }
          var namestyle = ui.create.div('.name',nametext,dialog);
          namestyle.dataset.camp = group;
          if(name && name2) {
            namestyle.style.fontSize = '18px';
            namestyle.style.letterSpacing = '1px';
          }

          //等阶图标
          var head = ui.create.node('img');
          head.src = extensionPath + 'character/images/decade/rarity_' + rarity + '.png';
          head.style.cssText = "display:inline-block;width:61.6px;height:53.2px;top:-13px; position:absolute;background-color: transparent;z-index:1;margin-left:5px;";
          namestyle.appendChild(head);

          //分包
          var getPack = function(name){
            for(const pak in lib.characterSort){
              for(const package in lib.characterSort[pak]){
                if (lib.characterSort[pak][package].contains(name)) {
                  if (pak == 'standard' || package == 'sp_waitforsort' || package == 'sp_qifu' || package == 'sp_others' || package == 'sp_guozhan2'
                    || pak == 'old' || pak == 'diy' || pak=='collab')
                    return lib.translate[pak+'_character_config'];
                  if (pak == 'sp') {
                    if (get.translation(package).length > 6) return get.translation(package).slice(0,2);
                  }
                  if (pak == 'sp2') {
                    if (get.translation(package).length > 6) return get.translation(package).slice(3,7);
                  }
                  if (pak == 'mobile') {
                    if (get.translation(package).length > 6) return '手杀异构';
                  }
                  if (pak == 'WeChatkill') return '微信三国杀';
                  if (pak == 'tw') return '海外';
                  if (pak == 'MiNikill') return '欢乐三国杀';
                  switch (package) {
                    case 'sp_decade':
                    case 'extra_decade':
                      return '限定';
                    case 'extra_tw':
                      return '海外';
                    case 'mobile_default':
                    case 'mobile_sunben':
                      return '手杀';
                    case 'offline_piracyE':
                      return '官盗E系列';
                    default:
                      return get.translation(package);
                  }
                }
              }
            }
            for(const pak in lib.characterPack){
              for(const namein in lib.characterPack[pak]){
                if(name == namein) return get.translation(pak+'_character_config');
              }
            }
            return '暂无分包';
          }
          var packinfo = ui.create.div('.pack',getPack(name),dialog);

          

          leftPane.innerHTML = '<div></div>';
      /*    createButton(name, leftPane.firstChild);
          createButton(name2, leftPane.firstChild);
          if (name && name2) {
            dialog.classList.remove('single');
          } else {
            dialog.classList.add('single');
          }*/

          rightPane.innerHTML = '<div></div>';
          lib.setScroll(rightPane.firstChild);
          var oSkills = player.getSkills(null, false, false).slice(0);
          oSkills = oSkills.filter(function (skill) {
            if (!lib.skill[skill] || skill == 'jiu') return false;
            if (lib.skill[skill].nopop || lib.skill[skill].equipSkill) return false;
            return lib.translate[skill + '_info'] && lib.translate[skill + '_info'] != '';
          });
          if (player == game.me && player.hiddenSkills.length) oSkills.addArray(player.hiddenSkills);

          var allShown = (player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag('viewHandcard', null, player, true)));
          var shownHs = player.getShownCards();
          if (shownHs.length) {
            ui.create.div('.xcaption', (player.getCards('h').some(card => !shownHs.includes(card)) ? '明置的手牌' : '手牌区域'), rightPane.firstChild);
            shownHs.forEach(function (item) {
              var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
              card.style.zoom = '0.6';
              rightPane.firstChild.appendChild(card);
            });
            if (allShown) {
              var hs = player.getCards('h');
              hs.removeArray(shownHs);
              if (hs.length) {
                ui.create.div('.xcaption', '其他手牌', rightPane.firstChild);
                hs.forEach(function (item) {
                  var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
                  card.style.zoom = '0.6';
                  rightPane.firstChild.appendChild(card);
                });
              }
            }
          }
          else if (allShown) {
            var hs = player.getCards('h');
            if (hs.length) {
              ui.create.div('.xcaption', '手牌区域', rightPane.firstChild);
              hs.forEach(function (item) {
                var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
                card.style.zoom = '0.6';
                rightPane.firstChild.appendChild(card);
              });
            }
          }

          if (oSkills.length) {
            ui.create.div('.xcaption', '武将技能', rightPane.firstChild);
            oSkills.forEach(function (name) {
              if (player.forbiddenSkills[name]) {
                if (player.forbiddenSkills[name].length) ui.create.div('.xskill', '<div data-color>' + '<span style="opacity:0.5">' + '【' + lib.translate[name] + '】' + '</span>' + '</div>' + '<div>' + '<span style="opacity:0.5">' + '（与' + get.translation(player.forbiddenSkills[name]) + '冲突）' + get.skillInfoTranslation(name, player) + '</span>' + '</div>', rightPane.firstChild);
                else ui.create.div('.xskill', '<div data-color>' + '<span style="opacity:0.5">' + '【' + lib.translate[name] + '】' + '</span>' + '</div>' + '<div>' + '<span style="opacity:0.5">' + '（双将禁用）' + get.skillInfoTranslation(name, player) + '</span>' + '</div>', rightPane.firstChild);
              }
              else if (player.hiddenSkills.includes(name)) {
                if (lib.skill[name].preHidden && get.mode() == 'guozhan') {
                  var id = name + '_idx';
                  id = ui.create.div('.xskill', '<div data-color>' + '<span style="opacity:0.5">' + '【' + lib.translate[name] + '】' + '</span>' + '</div>' + '<div>' + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>' + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div>' + '</div>', rightPane.firstChild);
                  var underlinenode = id.querySelector('.underlinenode');
                  if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove('on');
                  underlinenode.link = name;
                  underlinenode.listen(ui.click.hiddenskill);
                }
                else ui.create.div('.xskill', '<div data-color>' + '<span style="opacity:0.5">' + '【' + lib.translate[name] + '】' + '</span>' + '</div>' + '<div>' + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>' + '</div>', rightPane.firstChild);
              }
              else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) ui.create.div('.xskill', '<div data-color>' + '<span style="opacity:0.5">' + '【' + lib.translate[name] + '】' + '</span>' + '</div>' + '<div>' + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>' + '</div>', rightPane.firstChild);
              else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
                var id = name + '_id';
                id = ui.create.div('.xskill', '<div data-color>' + '【' + lib.translate[name] + '】' + '</div>' + '<div>' + get.skillInfoTranslation(name, player) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div>' + '</div>', rightPane.firstChild);
                var underlinenode = id.querySelector('.underlinenode');
                if (lib.skill[name].frequent) {
                  if (lib.config.autoskilllist.includes(name)) {
                    underlinenode.classList.remove('on');
                  }
                }
                if (lib.skill[name].subfrequent) {
                  for (var j = 0; j < lib.skill[name].subfrequent.length; j++) {
                    if (lib.config.autoskilllist.includes(name + '_' + lib.skill[name].subfrequent[j])) {
                      underlinenode.classList.remove('on');
                    }
                  }
                }
                if (lib.config.autoskilllist.includes(name)) underlinenode.classList.remove('on');
                underlinenode.link = name;
                underlinenode.listen(ui.click.autoskill2);
              }
              else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true)) {
                var id = name + '_idy';
                id = ui.create.div('.xskill', '<div data-color>' + '【' + lib.translate[name] + '】' + '</div>' + '<div>' + get.skillInfoTranslation(name, player) + '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>' + '</div>', rightPane.firstChild);
                var intronode = id.querySelector('.skillbutton');
                if (!_status.gameStarted || (lib.skill[name].clickableFilter && !lib.skill[name].clickableFilter(player))) {
                  intronode.classList.add('disabled');
                  intronode.style.opacity = 0.5;
                }
                else {
                  intronode.link = player;
                  intronode.func = lib.skill[name].clickable;
                  intronode.classList.add('pointerdiv');
                  intronode.listen(ui.click.skillbutton);
                }
              }
              else ui.create.div('.xskill', '<div data-color>【' + lib.translate[name] + '】</div>' + '<div>' + get.skillInfoTranslation(name, player) + '</div>', rightPane.firstChild);
            });
          }

          var eSkills = player.getVCards('e');
          if (eSkills.length) {
            ui.create.div('.xcaption', '装备区域', rightPane.firstChild);
            eSkills.forEach(function (card) {
              let str = [get.translation(card), get.translation(card.name + '_info')];
              const cards = card.cards;
              if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) str[0] += ('（' + get.translation(card.cards) + '）');
              const special = card.cards?.find(item => item.name == card.name && lib.card[item.name]?.cardPrompt);
              if (special) str[1] = lib.card[special.name].cardPrompt(special);
              ui.create.div('.xskill', '<div data-color>' + str[0] + '</div><div>' + str[1] + '</div>', rightPane.firstChild);
            });
          }

          var judges = player.getVCards('j');
          if (judges.length) {
            ui.create.div('.xcaption', '判定区域', rightPane.firstChild);
            judges.forEach(function (card) {
              const cards = card.cards;
              let str = get.translation(card);
              if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
                if (!lib.card[card]?.blankCard || player.isUnderControl(true)) str += ('（' + get.translation(cards) + '）');
              }
              ui.create.div('.xskill', '<div data-color>' + str + '</div><div>' + get.translation(card.name + '_info') + '</div>', rightPane.firstChild);
            });
          }

          container.classList.remove('hidden');
          game.pause2();
        };
        plugin.characterDialog = container;
        container.show(this);
      },
    },

  };
  return plugin;
});
