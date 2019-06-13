/* 
 * 视频播放器 引入了一些三方组件，暂时先放这里，后面有时间了，优化下
 */

import React, { Component } from 'react';
import { StyleSheet, View, Text, StatusBar, Dimensions, Animated, PanResponder, TouchableWithoutFeedback, BackHandler } from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from './icon';
import Orientation from 'react-native-orientation';
import Slider from './slider';

import { px, statusHeight } from './common/device';
import { translateTime } from '../util/filter';

const Controller = Animated.createAnimatedComponent(LinearGradient);

export default class VideoPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            height: px(426),
            width: px(750),
            duration: '00:00',
            currentTime: '00:00',
            silideValue: 0,
            isPlaying: true,
            isSlideChanging: false,
            isFullscreen: false,
            showController: false
        }
        this.currentTime = 0;
        this.durationTime = 0;
        this.controller = {
            opacity: new Animated.Value(0),
            show: false,
            animation: null,
            timer: null
        }
        this.touch = {
            panResponder: {},
            typeIndex: 0, //['Tap', 'doubleTap', 'move']
            firstTap: false,
            direction: null,
            startTime: 0,
            timer: null,
            videoTime: 0,
            silideValue: 0
        }
    }
    componentDidMount() {
        Orientation.lockToPortrait();//fixed 暂时先只能使用全屏按钮进行全屏播放
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {//监听back事件，取消全屏操纵
            if (this.state.isFullscreen) {
                this.full();
                return true;
            }
            return false;
        });
    }
    componentWillUnmount() {
        Orientation.lockToPortrait();//锁定为竖屏
        this.backHandler.remove();
        this.clearControlTimeout();
        this.touch.timer && clearTimeout(this.touch.timer);
    }
    componentWillMount() {
        this.touch.panResponder = PanResponder.create({
            // 要求成为响应者：
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {
                if (this.state.width / 2 > Math.abs(gestureState.x0)) {
                    console.log('在左边滑动')
                }
                this.touch.startTime = evt.nativeEvent.timestamp;
                this.touch.videoTime = this.currentTime / this.durationTime;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (Math.abs(gestureState.dx) === 0 && Math.abs(gestureState.dy) === 0) {
                    return;
                }
                if (this.touch.typeIndex !== 2) {
                    this.touch.typeIndex = 2;
                }
                if (!this.touch.direction) {
                    this.touch.direction = Math.abs(gestureState.dx) < Math.abs(gestureState.dy) ? 'y' : 'x';
                }
                if (this.touch.direction === 'x') {
                    let silideValue = this.touch.videoTime + gestureState.dx / Number(this.state.width);
                    if (silideValue < 0) {
                        silideValue = 0;
                    }
                    if (silideValue > 1) {
                        silideValue = 1;
                    }
                    this.touch.silideValue = silideValue;
                    this.sliderChange(silideValue);
                }

            },
            onPanResponderRelease: (evt, gestureState) => {
                let endTime = evt.nativeEvent.timestamp;
                if (endTime < this.touch.startTime + 200 && this.touch.typeIndex === 0) {
                    if (this.touch.firstTap === false) {
                        this.touch.firstTap = true;
                        this.touch.timer = setTimeout(() => {
                            this.touch.timer = null;
                            this.touch.firstTap = false;
                            this.trrigerShowController();
                        }, 350);
                    } else {
                        this.play();
                        this.touch.firstTap = false;
                        this.touch.timer && clearTimeout(this.touch.timer);
                    }
                }
                if (this.touch.typeIndex === 2) {
                    this.sliderChanged(this.touch.silideValue);
                }
                this.touch.typeIndex = 0;
                this.touch.direction = null;
            }
        });
    }
    trrigerShowController = () => {
        if (this.durationTime === 0) {
            return;
        }
        this.controller.opacity.stopAnimation();
        if (this.controller.show) {
            this.hideControlAnimation();
        } else {
            this.showControlAnimation();
        }
    }
    controlTImeout = () => {
        if (!this.state.isPlaying) {
            return;
        }
        this.controller.timer = setTimeout(() => {
            this.controller.timer = null;
            this.hideControlAnimation();
        }, 5000);
    }
    clearControlTimeout = () => {
        this.controller.timer && clearTimeout(this.controller.timer);
    }
    showControlAnimation = () => {
        this.controller.show = true;
        this.setState({ showController: true });
        this.controller.animation = Animated.timing(this.controller.opacity, {
            toValue: 1,
            duration: 500,
        })
        this.controller.animation.start();
        this.controlTImeout();
    }
    hideControlAnimation = () => {
        if (!this.state.isPlaying) {
            return;
        }
        this.controller.show = false;
        this.clearControlTimeout();
        this.controller.animation = Animated.timing(this.controller.opacity, {
            toValue: 0,
            duration: 500,
        })
        this.controller.animation.start(() => this.setState({ showController: false }));
    }
    play = () => {
        this.setState({
            isPlaying: !this.state.isPlaying
        });
        this.clearControlTimeout();
        this.controlTImeout();
    }
    full = () => {
        if (!this.state.isFullscreen) {
            this.videoContext.presentFullscreenPlayer();
            Orientation.lockToLandscape();
            let width = Dimensions.get('window').width;
            let height = Dimensions.get('window').height;
            if (width < height) {
                [width, height] = [height, width];
            }
            this.setState({
                height: height,
                width: width
            })
        } else {
            this.videoContext.dismissFullscreenPlayer();
            Orientation.lockToPortrait();
            this.setState({
                height: px(426),
                width: px(750)
            })
        }
        this.clearControlTimeout();
        this.controlTImeout();
        this.setState({
            isFullscreen: !this.state.isFullscreen
        });
    }
    sliderChanged = (value) => {//进度条拖动结束
        this.videoContext && this.videoContext.seek(value * this.durationTime);
        this.setState({
            isSlideChanging: false,
            currentTime: translateTime(value * this.durationTime)
        });
        this.controller.timer = setTimeout(() => {
            this.controller.timer = null;
            this.hideControlAnimation();
        }, 5000);
    }
    sliderChange = (value) => { //拖动进度条
        this.controller.timer && clearTimeout(this.controller.timer);
        this.setState({
            isSlideChanging: true,
            currentTime: translateTime(value * this.durationTime)
        });
    }
    videoLoad = (event) => {
        this.durationTime = event.duration;
        this.setState({
            duration: translateTime(event.duration)
        });
        this.showControlAnimation();
    }
    videoEnd = () => {
        this.videoContext.seek(0);
        this.setState({
            isPlaying: false,
            silideValue: 0,
            currentTime: '00:00'
        });
        this.showControlAnimation();
    }
    videoProgress = (event) => {
        if (this.state.isSlideChanging) {
            return;
        }
        this.currentTime = event.currentTime;
        this.setState({
            currentTime: translateTime(event.currentTime),
            silideValue: event.currentTime / this.durationTime
        })
    }
    backRender = () => {
        if (!this.state.showController) {
            return;
        }
        let title = this.props.videoDetail.title ? this.props.videoDetail.title : '';
        return (
            <Controller style={[style.titleBar, { opacity: this.controller.opacity }]} colors={['rgba(0,0,0,0.5)', 'rgba(225,225,225,0)']}>
                <Icon name='zuojiantoux' size={px(38)} style={style.backIcon} onPress={this.full}></Icon>
                <Text style={style.title}>{title}</Text>
            </Controller>
        )
    }
    controlRender = () => {
        if (!this.state.showController) {
            return;
        }
        return (
            <Controller style={[style.controller, { opacity: this.controller.opacity }]} colors={['rgba(225,225,225,0)', 'rgba(0,0,0,0.5)']}>
                <TouchableWithoutFeedback onPress={this.play}>
                    <View style={[style.playBtn, this.state.isPlaying ? '' : style.playBtnPauseed]}>
                        <Icon name={this.state.isPlaying ? 'bofangbaisex1' : 'bofangbaisex'} color='#333' size={px(32)}></Icon>
                    </View>
                </TouchableWithoutFeedback>
                <Text style={style.time}>{this.state.currentTime} / {this.state.duration}</Text>
                <Slider
                    onChange={this.sliderChange}
                    onChanged={this.sliderChanged}
                    minimumTrackTintColor='#FFDD00'
                    maximumTrackTintColor='rgba(225,225,225,0.7)'
                    thumbTintColor='#FFDD00'
                    value={this.state.silideValue}
                    style={style.slider}
                />
                <Icon onPress={this.full} style={style.fullIcon} name={this.state.isFullscreen ? 'suoxiaox' : 'fangdax'} color='#ffffff' size={px(38)} />
            </Controller>
        )
    }
    touchViewRender = () => {
        let touchViewContent = null;
        if (this.touch.direction === 'x') {
            touchViewContent = (
                <View style={style.touchViewContent}>
                    <Text style={style.middleTime}>{this.state.currentTime}</Text>
                    <View style={style.middleProgress}>
                        <View style={[style.middleProgressChanged, { width: px(160) * this.touch.silideValue }]}></View>
                    </View>
                </View>
            )
        }
        return (
            <View style={style.touchView} {...this.touch.panResponder.panHandlers}>
                {touchViewContent}
            </View>
        )
    }
    render() {
        return (
            <View ref={ref => this.playerView = ref} style={[style.container, { height: this.state.height, zIndex: this.state.isFullscreen ? 101 : 10 }]}>
                <StatusBar barStyle='linght-content' backgroundColor='rgba(0,0,0,0)' translucent={true} hidden={this.state.isFullscreen} />
                {this.state.isFullscreen && this.backRender()}
                {this.props.videoDetail.url && (
                    <Video
                        source={{ uri: this.props.videoDetail.url }}
                        ref={ref => this.videoContext = ref}
                        progressUpdateInterval={1000}
                        paused={!this.state.isPlaying}
                        fullscreen={this.state.isFullscreen}
                        onLoad={this.videoLoad}
                        onEnd={this.videoEnd}
                        onProgress={this.videoProgress}
                        style={{ flex: 1 }}
                    />
                )}
                {this.touchViewRender()}
                {this.controlRender()}
            </View>
        )
    }
}

const style = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        position: 'relative',
    },
    titleBar: {
        position: 'absolute',
        zIndex: 101,
        top: 0,
        left: 0,
        right: 0,
        height: px(100),
        alignItems: 'center',
        flexDirection: 'row'
    },
    backIcon: {
        color: '#fff',
        height: px(90),
        width: px(90),
        lineHeight: px(90),
        paddingLeft: px(30),
        zIndex: 100,
    },
    title: {
        fontSize: px(32),
        color: '#fff',
        marginLeft: px(16)
    },
    controller: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: px(88),
        alignItems: 'center',
        flexDirection: 'row'
    },
    playBtn: {
        width: px(56),
        height: px(56),
        marginLeft: px(20),
        borderRadius: px(56),
        backgroundColor: '#FFDD00',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#333333',
    },
    playBtnPauseed: {
        paddingLeft: px(4)
    },
    time: {
        color: '#fff',
        fontSize: px(24),
        marginLeft: px(16),
    },
    slider: {
        flex: 1,
        marginLeft: px(10),
        marginRight: px(10)
    },
    fullIcon: {
        paddingRight: px(20),
        height: px(88),
        lineHeight: px(88)
    },
    touchView: {
        position: 'absolute',
        backgroundColor: 'rgba(225,225,225,0)',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    middleTime: {
        fontSize: px(54),
        color: '#ffffff'
    },
    touchViewContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    middleProgress: {
        width: px(160),
        height: px(6),
        borderRadius: px(6),
        backgroundColor: 'rgba(225,225,225,0.7)',
        overflow: 'hidden'
    },
    middleProgressChanged: {
        height: px(6),
        backgroundColor: '#FFDD00',
    },
})
