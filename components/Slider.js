import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableWithoutFeedback, View, PanResponder, Animated } from 'react-native';

import { px, deviceWidth } from './common/device';

export default class Slider extends PureComponent {
    constructor(props) {
        super(props);
        this._panResponder = {};
        this.state = {
            width: 0,
            value: new Animated.Value(this.props.value),
        }
    }
    static propTypes = {
        value: PropTypes.number,
        minimumTrackTintColor: PropTypes.string,
        maximumTrackTintColor: PropTypes.string,
        thumbTintColor: PropTypes.string,
        onChanged: PropTypes.func,
        onChange: PropTypes.func,
        style: PropTypes.object
    }
    static defaultProps = {
        value: 0,
        minimumTrackTintColor: '#3f3f3f',
        maximumTrackTintColor: '#b3b3b3',
        thumbTintColor: '#343434'
    };
    componentWillReceiveProps(nextProps) {
        const newValue = nextProps.value;
        if (this.props.value !== newValue) {
            this.state.value.setValue(newValue);
        }
    }
    componentWillMount() {
        this._panResponder = PanResponder.create({
            // 要求成为响应者：
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {
                this.firstValue = this.state.value._value
            },
            onPanResponderMove: (evt, gestureState) => {
                let value = this.firstValue + gestureState.dx / this.state.width;
                if (value < 0) {
                    value = 0;
                }
                if (value > 1) {
                    value = 1
                }
                this.sliderValue = value;
                this.state.value.setValue(this.sliderValue);
                this.props.onChange && this.props.onChange(value)
            },
            onPanResponderRelease: (event, gestureState) => {
                this.props.onChanged && this.props.onChanged(this.sliderValue)
            }
        });
    }
    viewLayout = (event) => {
        this.progressWidth = event.nativeEvent.layout.width - px(24);
        this.setState({
            width: event.nativeEvent.layout.width
        })
    }
    clickSlider = (event) => {
        let locationX = event.nativeEvent.locationX - px(12);
        const pageX = event.nativeEvent.pageX;
        if (locationX < 0) {
            locationX = 0;
        }
        if (locationX > this.progressWidth) {
            locationX = this.progressWidth;
        }
        this.bindClick(locationX);
    }
    clickProgress = (event) => {
        this.bindClick(event.nativeEvent.locationX);
    }
    bindClick = (locationX) => {
        const value = locationX / this.progressWidth;
        this.state.value.setValue(value);
        this.props.onChanged && this.props.onChanged(value);
    }
    render() {
        const {
            minimumTrackTintColor,
            maximumTrackTintColor,
            thumbTintColor,
            thumbTouchSize,
            style
        } = this.props;
        const { value, width } = this.state;
        const thumbLeft = value.interpolate({
            inputRange: [0, 1],
            outputRange: [px(2), width - px(22)]
        });
        const minimumTrackWidth = value.interpolate({
            inputRange: [0, 1],
            outputRange: [0, width - px(24)]
        });
        return (
            <TouchableWithoutFeedback onPress={this.clickSlider}>
                <View style={[styles.content, style]} onLayout={this.viewLayout}>
                    <TouchableWithoutFeedback onPress={this.clickProgress}>
                        <View style={[styles.progress, { backgroundColor: maximumTrackTintColor }]}>
                            <Animated.View
                                ref={ref => this.progress = ref}
                                style={[styles.progressChanged, { width: minimumTrackWidth, backgroundColor: minimumTrackTintColor }]}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                    <Animated.View style={[styles.thumbHandle, { left: thumbLeft }]} {...this._panResponder.panHandlers}>
                        <View style={[styles.thumbBlock, { backgroundColor: thumbTintColor }]} />
                    </Animated.View>
                </View >
            </TouchableWithoutFeedback >
        );
    }
}

const styles = StyleSheet.create({
    content: {
        height: px(40),
        paddingLeft: px(12),
        paddingRight: px(12),
        justifyContent: 'center',
        position: 'relative'
    },
    thumbHandle: {
        height: px(40),
        width: px(20),
        backgroundColor: 'rgba(225,225,225,0)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0
    },
    thumbBlock: {
        width: px(20),
        height: px(20),
        borderRadius: px(20),
        overflow: 'hidden'
    },
    progress: {
        height: px(6),
        borderRadius: px(6),
        overflow: 'hidden'
    },
    progressChanged: {
        height: px(6)
    }
})