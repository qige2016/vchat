$(function(){
    var that = this;
    var h = $(document).height();
    $("#player1").resize(function () {          
        _historyMsgHeight(h);
    });
    var randomColor = '#' + Math.floor(Math.random()*0xffffff).toString(16);
    $(".aplayer").css("margin", "0");
    $("#colorStyle").val(randomColor); 
   
    //建立到服务器的socket连接
    this.socket = io.connect();
    //监听socket的connect事件，此事件表示连接已经建立
    this.socket.on("connect", function() {
        //连接到服务器后，显示昵称输入框
        $("#info").html("请输出你的昵称:)");
        $("#nickWrapper").css("display", "block");
        $("#nicknameInput").focus();
    });
    this.socket.on("nickExisted", function() {
        $("#info").html("昵称已被占用");//显示昵称已被占有的提示
    });
    this.socket.on("loginSuccess", function() {
        $(document).attr("title", "Vchat | " + $("#nicknameInput").val());
        $("#loginWrapper").css("display", "none");//隐藏遮罩层显示聊天界面
        $("#messageInput").focus();//让消息输入框获得焦点
    });
    this.socket.on("error", function(err) {
        if ($("#loginWrapper").css("display")=="none") {
            $("#status").html("连接失败:(");
        } else {
            $("#info").html("连接失败:(");
        }
    });
    this.socket.on("system", function(nickName, users, userCount, type) {
        //判断用户是否连接还是离开以显示不同的信息
        var msg = nickName + (type == 'login' ? ' 在线' : ' 离线');
        _displayNewMsg('系统消息', msg, 'red');
        $("#status").html(userCount + '名用户在线');
        //显示用户列表
        var $userList = $("#userList");
            docFragment = document.createDocumentFragment();
            $docFragment = $(docFragment);
            for (var i = 0; i < userCount; i++) {
                var userLi = document.createElement('li');
                userLi.innerHTML = '<span>' + users[i] + '</span>' + '<span>' + '在线' + '</span>';
                userLi.title = i; 
                $docFragment.append(userLi);
            }
        $userList.html(docFragment);
    });
    this.socket.on("newPlay", function(nickName, musicName, arName, url, src) {
        var msg = nickName + " 点播了 " + musicName; 
        var playIndex = $(".aplayer-list li").length;
        _displayNewMsg('系统消息', msg, 'red');
        ap1.addMusic([{
            'title' : musicName,
            'author' : arName,
            'url' : url,
            'pic' : src
        }]);
        ap1.setMusic(playIndex);
    });    
    this.socket.on("search", function(data) {
        var docFragment = document.createDocumentFragment(),
            $docFragment = $(docFragment);

        for(var i = 0; i < data.result.songs.length; i++){
            var playlistLi = document.createElement('li'),
                musicName = data.result.songs[i].name,
                arName = data.result.songs[i].ar[0].name;
                src = data.result.songs[i].al.picUrl + '?param=50y50';
            playlistLi.innerHTML = '<img src="' + src + '">' + '<span id="musicName">' + musicName + '</span>' + '<span id="arName">' + arName + '</span>';
            playlistLi.title = data.result.songs[i].id;
            $docFragment.append(playlistLi); 
        }
        $playlistUl.html(docFragment);
    });
    this.socket.on("newMsg", function(user, msg, color) {
        //发送信息
        _displayNewMsg(user, msg, color);
    });
    this.socket.on("newImg", function(user, img, color) {
        //发送图片
        _displayImage(user, img, color);
    });
    this.socket.on("newDanmu", function(user, msg, color) {
        //发射弹幕
        _displaybullet(user, msg, color);
    });
    //登录事件
    $("#loginBtn").click(function() {
        var nickName = $("#nicknameInput").val();
        if (nickName.trim().length != 0) {
            that.socket.emit('login', nickName);
            
        } else {
            $("#nicknameInput").focus();
        };
    })
    $("#nicknameInput").keyup(function(e) {
        if (e.keyCode == 13) {
            var nickName = $("#nicknameInput").val();
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            };
        };
    });
    //隐藏用户列表
    var flag=true;
    $("#toggleUserList").click(function() {   
        $("#userUl").toggle("slow");
        if(flag){ 
            $("#tag").removeClass().addClass("glyphicon glyphicon-chevron-right");
            flag = false;
        }else{
            $("#tag").removeClass().addClass("glyphicon glyphicon-chevron-left");
            flag = true;
        }
    });
    //发送信息
    $("#messageInput").keyup(function(e) {
        var $messageInput = $("#messageInput"),
            msg = $messageInput.val(),
            //获取颜色
            color = $("#colorStyle").val(),
            nickName = $("#nicknameInput").val();
        if (e.keyCode == 13 && msg.trim().length != 0) {
            $messageInput.val("");
            that.socket.emit('postMsg', msg, color);
            _displayNewMsg(nickName, msg, color);
        }
    });
    //发射弹幕
    $("#checkbox1").click(function() {
        if(this.checked){
            $("#messageInput").off();
            $("#messageInput").keyup(function(e) {
                var $messageInput = $("#messageInput"),
                msg = $messageInput.val(),
                reg = /\[emoji:\d+\]/g,
                //获取颜色
                color = $("#colorStyle").val(),
                nickName = $("#nicknameInput").val();
                match = reg.exec(msg);
                if (e.keyCode == 13 && msg.trim().length != 0) {
                    $messageInput.val("");
                    that.socket.emit('postMsg', msg, color);
                    _displayNewMsg(nickName, msg, color);
                    if(!match){
                        that.socket.emit('danmu', msg, color);
                        _displaybullet(nickName, msg, color);
                    }
                }
            });
        }else{
            $("#messageInput").off();
            $("#messageInput").keyup(function(e) {
                var $messageInput = $("#messageInput"),
                msg = $messageInput.val(),
                //获取颜色
                color = $("#colorStyle").val();
                nickName = $("#nicknameInput").val();
                if (e.keyCode == 13 && msg.trim().length != 0) {
                    $messageInput.val("");
                    that.socket.emit('postMsg', msg, color);
                    _displayNewMsg(nickName, msg, color);
                }
            });
        }     
    });
    //清除事件
    $("#clearBtn").click(function() {
        $("#historyMsg").html("");
    });
    //发送图片
    $("#sendImage").change(function() {
        var nickName = $("#nicknameInput").val();
        if (this.files.length != 0) {
            //获取文件并用FileReader进行读取
            var file = this.files[0],
                reader = new FileReader(),
                color = $("#colorStyle").val();
            if (!reader) {
                _displayNewMsg('system', '浏览器不支持FileReader', 'red');
                return;
            }
            if(!/image\/\w+/.test(file.type)){
                _displayNewMsg('system', '不支持上传文件类型', 'red');
                return;
            }
            reader.readAsDataURL(file);//读取指定对象内容
            reader.onload = function(e) {
                that.socket.emit('img', e.target.result, color);//读取结果值
                _displayImage(nickName, e.target.result, color); 
            } 
        }
    });
    //表情事件
    _initialEmoji();
    //单击表情按钮显示表情窗口
    //再单击则取消
    $("#emoji").click(function(e) {
        $("#emojiWrapper").toggle();
        e.stopPropagation();//终止冒泡过程
    });
    //单击页面其他地方关闭表情窗口
    $(document).click(function(e) {
        var $emojiwrapper = $("#emojiWrapper");
        if (e.target != $emojiwrapper) {
            $emojiwrapper.css("display", "none");
           
        }
    });
    $("#emojiWrapper").click(function(e) {
        //获取被单击的表情
        var target = e.target;
        if (target.nodeName.toLowerCase() == 'img') {
            var $messageInput = $("#messageInput");
            $messageInput.focus();
            $messageInput.val($messageInput.val() + '[emoji:' + target.title + ']');
        }
    });
    //音乐事件
    _initialPlaylist();
    $("#music").click(function(e) {
        $("#playlistWrapper").toggle();
        $("#messageInput").toggle();
        e.stopPropagation();//终止冒泡过程
    });
    $(".controls").resize(function () {  
        _historyMsgHeight(h);  
        var $container = $("#historyMsg");      
        $container.scrollTop($container.prop("scrollHeight"));
    });
    //添加歌单
    $("#searchButton").click(function(){
        var keywords = $searchInput.val();
        that.socket.emit('search', keywords);
    });
    //点播搜索列表的歌曲
    $("#playlistUl").on('click','li',function(){
        var musicName = $(">span", this).eq(0).html(),
            arName = $(">span", this).eq(1).html(),
            id = $(this).attr("title"),
            url = "http://music.163.com/song/media/outer/url?id="+ id +".mp3",
            src = $(">img", this).attr("src");
        that.socket.emit('play', musicName, arName, url, src);
    });
});
function _historyMsgHeight(h){
    var h_controls = $(".controls").height();
    var h_player1 = $("#player1").height();
    var div_h = h - h_controls - h_player1 ;
    $("#historyMsg").css({"height":div_h+"px"});
}
function _initialPlaylist() {
    var playlist = $("#playlistWrapper");
        docFragment = document.createDocumentFragment();
        $docFragment = $(docFragment);
        $playlistDiv =$('<div id="playlistDiv"></div>');
        $searchDiv = $('<div id="searchDiv"></div>');
        $playlistUl = $('<ul id="playlistUl"></ul>');
        $searchInput = $('<input type="text" id="search" maxlength="30">');
        $searchButton = $('<button id="searchButton">搜 索!</button>');
        $searchDiv.append($searchInput, $searchButton);
        $playlistDiv.append($searchDiv, $playlistUl);
        $docFragment.append($playlistDiv);
        playlist.append(docFragment);
}
function _initialEmoji() {
    var emojiContainer = $("#emojiWrapper"),
        docFragment = document.createDocumentFragment();
        $docFragment = $(docFragment);
    for (var i = 18; i > 0; i--) {
        var emojiItem = document.createElement('img');
        emojiItem.src = '../content/emoji/' + i + '.gif';
        emojiItem.title = i;
        $docFragment.append(emojiItem);
    };
    emojiContainer.append(docFragment);
}
function _displayNewMsg(user, msg, color) {
    var $container = $("#historyMsg"),
        msgToDisplay = document.createElement('p'),
        $msgToDisplay = $(msgToDisplay),
        date = new Date().toTimeString().substr(0, 8),
        //将消息中的表情转换为图片
        msg = _showEmoji(msg);
    msgToDisplay.style.color = color || '#fff';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
    $container.append(msgToDisplay);
    $container.scrollTop($container.prop("scrollHeight"));
}
function _displaybullet(user, msg, color){
    var danmu = $("<div class='bullet'>" + msg + "</div>"),
        fontSize = Math.floor((Math.random() + 1) * 24) + "px",
        top = Math.floor(Math.random() * 400) + "px";
    top = parseInt(top) > 352 ? "352px" : top;
    danmu.css({
        "position": 'absolute',
        "color": color || '#fff',
        "font-size": fontSize,
        "right": 0,
        "top": top
    });
    $("#showDanmu").append(danmu);
    danmu.animate({left: '-' + danmu.width() + "px"}, 15000,function(){  
        $(this).hide();  
    });  
}
function _displayImage(user, imgData, color) {
    var $container = $("#historyMsg"),
        msgToDisplay = document.createElement('p'),
        $msgToDisplay = $(msgToDisplay),
        date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#fff';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
    $container.append(msgToDisplay);
    $container.scrollTop($container.prop("scrollHeight"));

}
function _showEmoji(msg) {
    var match, result = msg,
        reg = /\[emoji:\d+\]/g,
        emojiIndex,
        totalEmojiNum = $("#emojiWrapper").children().length;
    while (match = reg.exec(msg)) {
        emojiIndex = match[0].slice(7, -1);
        if (emojiIndex > totalEmojiNum) {
            result = result.replace(match[0], '[X]');
        } else {
            result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
        };
    };
    return result;
}
var ap1 = new APlayer({
    element: document.getElementById('player1'),
    narrow: false,
    autoplay: false,
    showlrc: false,
    mutex: true,
    theme: '#e6d0b2',
    preload: 'metadata',
    mode: 'random',
    music: [
        {
            title: '她说',
            author: '林俊杰',
            url: 'http://music.163.com/song/media/outer/url?id=108242.mp3',
            pic: 'http://p1.music.126.net/peLODpaxX1Hl4RWYKR-34Q==/109951163071284933.jpg?param=50y50',
        },
        {
            title: '背对背拥抱',
            author: '林俊杰',
            url: 'http://music.163.com/song/media/outer/url?id=108418.mp3',
            pic: 'http://p1.music.126.net/oALpJH1SwQE9eLaYQHLQHw==/109951163071285497.jpg?param=50y50',
        }
    ]
});

