function AudioPlayer(sourceLink) {
    /**
     * Reference to object from different contexts
     */
    var _this     = this;

    /**
     * Player Instance
     * @type {Audio}
     * @private
     */
    var player    = new Audio(sourceLink);

    var isSeeking, isChangingVolume = false;

    /**
     * Information about full audio length and audio.currentTime converted to minutes and seconds
     * @type {object}
     * @private
     */
    var audioLength = {
        "full": {
            "minutes": "00",
            "seconds": "00"
        },
        "current": {
            "minutes": "00",
            "seconds": "00"
        }
    };


    /**
     * Attributes of player controls
     * @type {object}
     * @private
     */
    var controls = {
        "playerControls":{
            "className":  "player-control-panel",
            "style":{
                "position": "fixed",
                "bottom": "10px",
                "right": "20px",
                "height": "25px",
                "textAlign": "center",
                "webkitUserSelect" : "none",
                "webkitTouchCallout": "none",
                "khtmlUserSelect": "none",
                "MozUserSelect": "none",
                "msUserSelect": "none",
                "userSelect":  "none"
            }
        },
        "play":{
            "className": "play",
            "title": "Play audio",
            "innerHTML": "&#9654;",
            "style": {
                "float": "left",
                "height": "100%",
                "width": "25px",
                "border": "1px solid black",
                "cursor": "pointer",
                "boxSizing": "border-box"
            }
        },
        "progressBar":{
            "style": {
                "float": "left",
                "height": "100%",
                "marginLeft": "5px"
            }
        },
        "progressBarSeeker": {
            "className": "progress-bar-seeker",
            "style": {
                "width": "0%",
                "backgroundColor": "rgba(91, 164, 246, 0.3)",
                "borderRadius": "0"
            }
        },
        "progressBarBg": {
            "className": "progress-bar-bg",
            "style": {
                "position": "relative",
                "height": "100%",
                "width": "300px",
                "backgroundColor": "rgb(219, 212, 212)",
                "cursor": "pointer",
                "borderRadius": "0 3px 3px 0"
            }
        },
        "soundControl": {
            "className": "sound-control",
            "style": {
                "float": "left",
                "height": "100%",
                "marginLeft": "10px",
                "cursor": "pointer",
                "backgroundColor": "rgba(0,0,0,0.3)"
            }
        },
        "soundControlSeeker": {
            "className": "sound-control-seeker",
            "style": {
                "backgroundColor": "green",
                "height": "100%",
                "bottom": "0",
                "position": "absolute"
            }
        },
        "soundControlBg": {
            "className": "sound-control-bg",
            "style": {
                "width": "8px",
                "backgroundColor": "transparent",
                "height": "100%",
                "cursor": "pointer",
                "position": "relative"
            }
        }
    };

    var controlsItems = {};

    /**
     * Initializes new instance of audio player
     */
    var initialize = function(){
        player.ondurationchange = function () {
            audioLength.full.minutes = Math.floor(player.duration / 60);
            audioLength.full.seconds = Math.floor(player.duration % 60);
            audioLength.current.minutes = "00";
            audioLength.current.seconds = "00";

            document.body.appendChild(createPlayerControls());
        };


        window.onmouseup = function(){
            isSeeking = isChangingVolume = false;
        };
    };


    /**
     * Recursively declares DOM element attributes based on passed values
     * @param targetElement
     * @param attributes
     * @returns {*}
     */
    var fillAttributes = function(targetElement, attributes){

        for(var i in attributes){
            if(attributes.hasOwnProperty(i)){
                if(typeof attributes[i] == "object"){
                    fillAttributes(targetElement[i], attributes[i]);
                } else{
                    targetElement[i] = attributes[i];
                }
            }
        }

        return targetElement;
    };


    /**
     * Generates full player control panel
     * @returns {Element}
     */
    var createPlayerControls = function(){
        controlsItems.playerControls = document.createElement("div");
        controlsItems.playerControls = fillAttributes(controlsItems.playerControls, controls.playerControls);

        player.onended = function(){
            controlsItems.play.innerHTML = controls.play.innerHTML;
            _this.seekTo(0);
            renderProgress(true);
        };

        controlsItems.playerControls.appendChild(createPlayButton());
        controlsItems.playerControls.appendChild(createProgressBar());
        controlsItems.playerControls.appendChild(createSoundControl());

        return controlsItems.playerControls;
    };


    /**
     * Generates play|pause button
     * @returns {Element}
     */
    var createPlayButton = function(){
        controlsItems.play = document.createElement("div");

        controlsItems.play = fillAttributes(controlsItems.play, controls.play);

        controlsItems.play.onclick = function(){
            if (_this.play()) {
                controlsItems.play.innerHTML = "&#9208;";
                controlsItems.play.title = "Pause";
            } else {
                controlsItems.play.innerHTML = controls.play.innerHTML;
                controlsItems.play.title = controls.play.title;
            }
        };

        return controlsItems.play;
    };


    /**
     * Generates full progress bar(background, foreground and etc)
     * @returns {Element}
     */
    var createProgressBar = function(){
        controlsItems.progressBar = document.createElement("div");
        controlsItems.progressBar = fillAttributes(controlsItems.progressBar, controls.progressBar);

        controlsItems.progressBarBg = document.createElement("div");
        controlsItems.progressBarBg = fillAttributes(controlsItems.progressBarBg, controls.progressBarBg);

        controlsItems.progressBarSeeker = controlsItems.progressBarBg.cloneNode(true);
        controlsItems.progressBarSeeker = fillAttributes(controlsItems.progressBarSeeker, controls.progressBarSeeker);
        controlsItems.progressBarSeeker.style.top = "-" + controls.playerControls.style.height;

        controlsItems.progressBar.onmousedown =function(e){
            if(e.button!==0){
                return;
            }
            isSeeking = true;
            var barFullLength = parseInt(controlsItems.progressBarBg.style.width);
            var timePosition = (e.offsetX/barFullLength) * (audioLength.full.seconds + (audioLength.full.minutes * 60));
            _this.seekTo(Math.floor(timePosition));
            renderProgress();
        };

        controlsItems.progressBar.onmousemove = function(e){
            if(isSeeking){
                controlsItems.progressBar.onmousedown(e);
            }
        };

        controlsItems.progressBar.appendChild(controlsItems.progressBarBg);
        controlsItems.progressBar.appendChild(controlsItems.progressBarSeeker);

        setInterval(function(){renderProgress();}, 500);

        renderProgress(true);

        return controlsItems.progressBar;
    };


    /**
     * Updates current progress bar visualy.
     *
     * @param forceRender
     */
    var renderProgress = function(forceRender){
        var minutes = Math.floor(player.currentTime / 60);
        var seconds = Math.floor(player.currentTime % 60);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if(!forceRender && (audioLength.current.minutes == minutes && audioLength.current.seconds == seconds)){
            return;
        }

        var progress = 100 * player.currentTime/player.duration;

        audioLength.current.minutes = minutes;
        audioLength.current.seconds = seconds;
        controlsItems.progressBarBg.innerHTML = audioLength.current.minutes +":"+ audioLength.current.seconds;
        controlsItems.progressBarBg.innerHTML += "/" + audioLength.full.minutes +":"+ audioLength.full.seconds;
        controlsItems.progressBarSeeker.style.width = progress.toFixed(5) + "%";
    };


    var createSoundControl = function(){
        controlsItems.soundControl = document.createElement("div");
        controlsItems.soundControl = fillAttributes(controlsItems.soundControl, controls.soundControl);

        controlsItems.soundControlBg = document.createElement("div");
        controlsItems.soundControlBg = fillAttributes(controlsItems.soundControlBg, controls.soundControlBg);


        controlsItems.soundControlSeeker = controlsItems.soundControlBg.cloneNode(true);
        controlsItems.soundControlSeeker = fillAttributes(controlsItems.soundControlSeeker, controls.soundControlSeeker);

        controlsItems.soundControlBg.onmousedown = function(e){
            if(e.button !== 0){
                return;
            }
            isChangingVolume = true;

            var fullVolumeHeight = parseInt(controls.playerControls.style.height);
            var volume = (Math.abs(e.offsetY - fullVolumeHeight)/fullVolumeHeight).toFixed(2);
            player.volume = volume;

            controlsItems.soundControlSeeker.style.height = (volume * 100) + "%";
        };

        controlsItems.soundControlBg.onmousemove = function(e){
            if(isChangingVolume){
                controlsItems.soundControlBg.onmousedown(e);
            }
        };

        controlsItems.soundControl.appendChild(controlsItems.soundControlSeeker);
        controlsItems.soundControl.appendChild(controlsItems.soundControlBg);

        return controlsItems.soundControl;
    };

    _this.deleteInstance = function(){
        player.pause();
        player.src = '';
        controlsItems.playerControls.parentNode.removeChild(controlsItems.playerControls);
    };

    _this.play = function(){
        player.paused ? player.play() : player.pause();

        return !player.paused;
    };

    _this.seekTo = function(timePosition){
        player.currentTime = timePosition;
    };

    initialize();
}