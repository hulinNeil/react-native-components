/* 
 * 虚线
 */

import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { deviceWidth, px } from './common/device';

export default class Dotted extends Component {
    render() {
        var len = deviceWidth / px(12);
        var arr = [];
        for (let i = 0; i < len; i++) {
            arr.push(i);
        }
        return <View style={style.dashLine}>
            {
                arr.map((item, index) => (
                    <Text style={style.dashItem} key={'dash' + index}> </Text>
                ))
            }
        </View>
    }
}
const style = StyleSheet.create({
    dashLine: {
        flexDirection: 'row',
        flex: 1,
        overflow: 'hidden'
    },
    dashItem: {
        height: 1,
        width: px(6),
        marginRight: px(6),
        backgroundColor: '#dddfe3'
    }
})