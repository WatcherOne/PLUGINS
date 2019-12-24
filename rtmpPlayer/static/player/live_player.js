function live_get_version_code() {
	return '1.0'
}

function uPlayer(container) {
	player = get_live_player(container)
	if(player == null) {
		player = new LivePlayer(container, 1, '100%', '100%', null)
		player.start(player.width, player.height, 0, 1, 0.5, 0)
	}
	return player
}

function LivePlayer(container, streamcount, width, height, private_object) {
	if(!LivePlayer.__id) {
		LivePlayer.__id = 100
	}
	if(!LivePlayer.__players) {
		LivePlayer.__players = []
	}
	LivePlayer.__players.push(this)

	this.private_object = private_object
	this.container = container
	this.width = width
	this.height = height
	this.id = LivePlayer.__id++
	this.stream_count = streamcount // doncy
	this.stream_url = null
	this.second_stream_url = null
	this.buffer_time = 0 // do not enable buffer time in default.
	this.volume = 1 // default to 100%
	this.callbackObj = null

	// callback set the following values.
	this.meatadata = {} // for on_player_metadata
	this.time = 0 // current stream time.
	this.buffer_length = 0 // current stream buffer length.
}

function get_live_player(container) {
	if(!LivePlayer || !LivePlayer.__players) {
		return null
	}
	for(var i = 0; i < LivePlayer.__players.length; i++) {
		var player = LivePlayer.__players[i]
		if(player.container !== container) {
			continue
		}
		return player
	}
	return null
}

/*
 * 加载flash播放器
 */
LivePlayer.prototype.start = function(width, height, debug, fullscreen, buffer, audcolumn) {
	this.width = width
	this.height = height

	// embed the flash.
	var flashvars = {}
	flashvars.id = this.id

	flashvars.debug = debug
	flashvars.fullscreen = fullscreen
	flashvars.bufferTime = buffer
	flashvars.dispAudColumn = audcolumn

	flashvars.on_player_ready = "__live_on_player_ready"
	flashvars.on_player_aud_col = "__live_on_player_aud_col"

	var self = this

	var params = {
		allowFullscreen: "true",
		allowScriptAccess: "sameDomain",
		bgcolor: "",
		wmode: "direct" // can cause issues with FP settings & webcam
	}

	var attributes = {
		id: "liveplayer#" + this.id
	}

	swfobject.embedSWF(
		"static/vgaplayer.swf?_ver=" + live_get_version_code(),
		this.container,
		this.width,
		this.height,
		"11.1.0",
		"static/playerProductInstall.swf",
		flashvars,
		params,
		attributes,
		function(callbackObj) {
			self.callbackObj = callbackObj
		}
	)
	return this
}

/*
 * 开始播放
 */
LivePlayer.prototype.play = function(url) {
	this.stop()
	LivePlayer.__players.push(this)
	if(url) {
		this.stream_url = url
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__play(this.stream_url)
	}
}

/*
 * 停止播放
 */
LivePlayer.prototype.stop = function() {
	for(var i = 0; i < LivePlayer.__players.length; i++) {
		var player = LivePlayer.__players[i]
		if(player.id !== this.id) {
			continue
		}
		LivePlayer.__players.splice(i, 1)
		break
	}
	if(this.callbackObj) {
		// this.callbackObj.ref.__stop()
	}
}

/*
 * 播放器加载完成回调
 */
LivePlayer.prototype.on_player_ready = function() {}

/*
 * 播放器音柱事件回调
 */
LivePlayer.prototype.on_player_aud_col = function(left, right) {}

/*
 * 打开调试日志
 */
LivePlayer.prototype.setdebug = function(enable) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__switchdebug(enable)
	}
}

/*
 * 开启低延时
 */
LivePlayer.prototype.setlowdelay = function(enable) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__setLowdelay(enable)
	}
}

/*
 * 显示播放器控制条,播放、停止、静音、全屏
 */
LivePlayer.prototype.showControl = function(enable) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__showControl(enable)
	}
}

/*
 * 显示播放器自带音柱
 */
LivePlayer.prototype.showAudColumn = function(enable) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__showAudColumn(enable)
	}
}

/*
 * 设置播放器logo，停止播放时显示
 */
LivePlayer.prototype.setLogo = function(url) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__setLogo(url)
	}
}

/*
 * 设置缓冲时间，默认0.5秒
 */
LivePlayer.prototype.setBufferTime = function(bt) {
	var player = __live_find_player(this.id)
	if(!player) {
		return
	}
	if(this.callbackObj) {
		this.callbackObj.ref.__setBufferTime(bt)
	}
}

function __live_find_player(id) {
	for(var i = 0; i < LivePlayer.__players.length; i++) {
		var player = LivePlayer.__players[i]
		if(player.id !== JSON.parse(id)) {
			continue
		}
		return player
	}
	throw new Error('player not found. id=' + id)
}

function __live_on_player_ready(id) {
	var player = __live_find_player(id)
	player.on_player_ready()
}

// 声道一直运行
function __live_on_player_aud_col(id, left, right) {
	var player = __live_find_player(id)
	player.on_player_aud_col(left, right)
}
